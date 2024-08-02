import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  PaginationViewModel,
  SortDirections,
} from '../../../../domain/sorting-base-filter';
import { getPagination } from '../../../../infra/utils/get-pagination';
import { Blog } from '../../domain/entities/blog.entity';
import { BlogsQueryFilter } from '../models/input.blog.models/blogs-query.filter';
import {
  getBlogsViewModel,
  getBlogsViewModelWithImages,
  getSABlogsViewModelFromRaw,
  getSACommentsForBlogsCurrentUserViewModelFromRaw,
} from '../models/output.blog.models/blogs.view.model';
import {
  AllCommentsForUserBlogsViewType,
  BlogViewModelType,
  BlogViewModelTypeWithImages,
  SABlogsViewType,
} from '../models/output.blog.models/blog.view.model-type';
import { UserAccount } from '../../../admin/domain/entities/user-account.entity';
import { Comment } from '../../../comments/domain/entities/comment.entity';
import { CommentsQueryFilter } from '../../../comments/api/models/output.comment.models/comment-query.filter';
import {
  FilesMetaBlogViewModelType,
  filesBlogMetaViewModel,
} from '../../../files/api/models/file-view.model';
import { FileMetadata, PhotoType, QuizAnswer } from '../../../../settings';
import { BlogImage } from '../../../files/domain/entities/blog-images.entity';

@Injectable()
export class BlogsQueryRepo {
  constructor(
    @InjectRepository(Blog) private readonly blogs: Repository<Blog>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async getAllCommentsForUserBlogs(
    userId: string,
    queryOptions: CommentsQueryFilter,
  ): Promise<PaginationViewModel<AllCommentsForUserBlogsViewType>> {
    const { pageNumber, pageSize, skip, sortBy, sortDirection } =
      getPagination(queryOptions);

    const [content] = [`%${queryOptions.searchContentTerm || ''}%`];

    const queryBuilder = this.dataSource
      .getRepository(Comment)
      .createQueryBuilder('comment');
    const blogQueryBuilder = this.blogs.createQueryBuilder('blogs');

    queryBuilder
      .leftJoin('comment.post', 'posts')
      .addSelect(['posts.id', 'posts.title', 'posts.blogId', 'posts.blogTitle'])
      .leftJoin('posts.blog', 'blogs')
      .leftJoin('comment.user', 'user')
      .addSelect('user.id')
      .where('blogs.user = :userId', { userId })
      .orderBy('comment.' + sortBy, sortDirection)
      .offset(skip)
      .limit(pageSize);

    queryBuilder
      .leftJoin(
        'comment.commentReactions',
        'commentReact',
        'commentReact.userAccountId = :userId',
        { userId },
      )
      .addSelect('commentReact.reactionType');

    const [comments, commentsCount] = await queryBuilder.getManyAndCount();

    const commentsResult = await Promise.all(
      comments.map(async (comment) => {
        const query = `
          SELECT 
            COUNT(
              CASE 
                WHEN cr."reactionType" = 'Like' 
                THEN 1 
              END
            ) AS "likesCount",
            COUNT(
              CASE 
                WHEN cr."reactionType" = 'Dislike' 
                THEN 1 
              END
            ) AS "dislikesCount"  
          FROM comment_reaction cr
          --LEFT JOIN user_account u ON cr."userAccountId" = u.id
          --LEFT JOIN user_bans bans ON u.id = bans."userId"
          WHERE cr."commentId" = $1 
          --AND (bans."isBanned" IS NULL OR bans."isBanned" = false)
        `;
        let [{ likesCount, dislikesCount }] = await this.dataSource.query(
          query,
          [comment.id],
        );

        return {
          ...comment,
          commentReactionCounts: {
            likes_count: parseInt(likesCount, 10),
            dislikes_count: parseInt(dislikesCount, 10),
          },
        };
      }),
    );

    return new PaginationViewModel<AllCommentsForUserBlogsViewType>(
      commentsResult.map(getSACommentsForBlogsCurrentUserViewModelFromRaw),
      pageNumber,
      pageSize,
      commentsCount,
    );
  }
  async getAllBlogs(
    queryOptions: BlogsQueryFilter,
    adminAccess = false,
  ): Promise<PaginationViewModel<BlogViewModelType | SABlogsViewType>> {
    try {
      const { searchNameTerm } = queryOptions;

      const { pageNumber, pageSize, skip, sortBy, sortDirection } =
        getPagination(queryOptions);

      const [title] = [`%${searchNameTerm || ''}%`];

      const queryBuilder = this.blogs.createQueryBuilder('blog');

      queryBuilder
        .select([
          'blog.id AS id',
          'blog.title AS title',
          'blog.description AS description',
          `blog.websiteUrl AS "websiteUrl"`,
          'blog.created_at AS created_at',
          `blog.isMembership AS "isMembership"`,
        ])
        .where('blog.title ILIKE :title', { title })
        .orderBy(
          sortBy === 'title'
            ? 'blog."title" COLLATE "C"'
            : sortBy === 'created_at'
            ? 'blog.created_at'
            : `blog.${sortBy}`,
          sortDirection,
        )
        .addSelect(
          (qb) =>
            qb
              .select(
                `
                  json_agg(
                    json_build_object( 
                      'fileUrl', fm."fileUrl", 
                      'fileSize', fm."fileSize", 
                      'fileHeight', fm."fileHeight", 
                      'fileWidth', fm."fileWidth",
                      'photoType', fm."photoType"
                    )
                  )
                `,
              )
              .from(FileMetadata, 'fm')
              .leftJoin(BlogImage, 'bi', 'bi.id = fm."blogImgId"')
              .where('bi."blogId"::text = blog.id::text'),
          'images',
        )
        .skip(skip)
        .take(pageSize);

      if (adminAccess) {
        queryBuilder
          .leftJoin('blog.user', 'user')
          .addSelect(['user.id as userId', 'user.login as userLogin'])
          .limit(pageSize)
          .offset(skip);

        const rawBlogs = await queryBuilder.getRawMany();
        const blogsCount = await queryBuilder.getCount();

        return new PaginationViewModel<SABlogsViewType>(
          rawBlogs.map(getSABlogsViewModelFromRaw),
          pageNumber,
          pageSize,
          blogsCount,
        );
      }

      const blogsCount = await queryBuilder.getCount();
      const blogs = await queryBuilder
        .andWhere('blog.isBanned = false')
        .getRawMany();

      return new PaginationViewModel<BlogViewModelType>(
        blogs.map(getBlogsViewModel),
        pageNumber,
        pageSize,
        blogsCount,
      );
    } catch (error) {
      console.error(error);
      throw new Error(
        `Some troubles occurred during find or paging blogs: ${error}`,
      );
    }
  }

  async getBlogsByBlogger(
    userId: string,
    queryOptions: BlogsQueryFilter,
  ): Promise<PaginationViewModel<BlogViewModelTypeWithImages>> {
    try {
      const { searchNameTerm } = queryOptions;

      const { pageNumber, pageSize, skip, sortBy, sortDirection } =
        getPagination(queryOptions);

      const [title] = [`%${searchNameTerm || ''}%`];

      const queryBuilder = this.blogs.createQueryBuilder('b');

      queryBuilder
        .select([
          'b.id AS id',
          'b.title AS title',
          'b.description AS description',
          `b.websiteUrl AS "websiteUrl"`,
          'b.created_at AS created_at',
          `b.isMembership AS "isMembership"`,
          `b.banDate as "banDate"`,
        ])
        .where('b.title ILIKE :title AND b."ownerId" = :userId', {
          title,
          userId,
        })
        .orderBy(
          sortBy === 'title'
            ? 'b."title" COLLATE "C"'
            : sortBy === 'created_at'
            ? 'b.created_at'
            : `b.${sortBy}`,
          sortDirection,
        )
        // .addSelect(
        //   (qb) =>
        //     qb
        //       .select(
        //         `json_build_object(
        //           'wall', (
        //             SELECT
        //               json_build_object(
        //                 'fileUrl', fm."fileUrl",
        //                 'fileSize', fm."fileSize",
        //                 'fileHeight', fm."fileHeight",
        //                 'fileWidth', fm."fileWidth"
        //               )
        //             FROM "file_metadata" fm
        //             LEFT JOIN "blog_image" bi ON bi.id = fm."blogImgId"
        //             WHERE bi."blogId"::text = b.id::text AND fm."photoType" = :wallType
        //           ),
        //           'main', (
        //             SELECT json_agg(
        //               json_build_object(
        //                 'fileUrl', fm."fileUrl",
        //                 'fileSize', fm."fileSize",
        //                 'fileHeight', fm."fileHeight",
        //                 'fileWidth', fm."fileWidth"
        //               )
        //             )
        //             FROM "file_metadata" fm
        //             LEFT JOIN "blog_image" bi ON bi.id = fm."blogImgId"
        //             WHERE bi."blogId"::text = b.id::text AND fm."photoType" = :mainType
        //           )
        //         )`
        //       )
        //       .from(Blog, 'b')
        //       .setParameter('wallType', PhotoType.WALLPAPER)
        //       .setParameter('mainType', PhotoType.MAIN),
        //   'images'
        // )
        .addSelect(
          (qb) =>
            qb
              .select(
                `
                  json_agg(
                    json_build_object( 
                      'fileUrl', fm."fileUrl", 
                      'fileSize', fm."fileSize", 
                      'fileHeight', fm."fileHeight", 
                      'fileWidth', fm."fileWidth",
                      'photoType', fm."photoType"
                    )
                  )
                `,
              )
              .from(FileMetadata, 'fm')
              .leftJoin(BlogImage, 'bi', 'bi.id = fm."blogImgId"')
              .where('bi."blogId"::text = b.id::text'),
          'images',
        )
        .skip(skip)
        .take(pageSize);

      const blogs = await queryBuilder.getRawMany();
      const blogsCount = await queryBuilder.getCount();

      return new PaginationViewModel<BlogViewModelTypeWithImages>(
        blogs.map(getBlogsViewModelWithImages),
        pageNumber,
        pageSize,
        blogsCount,
      );
    } catch (error) {
      console.error(error);
      throw new Error(
        `Some troubles occurred during find or paging blogs by blogger: ${error}`,
      );
    }
  }

  async getById(blogId: string): Promise<BlogViewModelType | null> {
    try {
      const queryBuilder = this.blogs.createQueryBuilder('blog');
      queryBuilder
        .select([
          'blog.id AS id',
          'blog.title AS title',
          'blog.description AS description',
          `blog.websiteUrl AS "websiteUrl"`,
          'blog.created_at AS created_at',
          `blog.isMembership AS "isMembership"`,
        ])
        .where('blog.id = :blogId', { blogId })
        .andWhere('blog.isBanned = false')
        .addSelect(
          (qb) =>
            qb
              .select(
                `
                  json_agg(
                    json_build_object( 
                      'fileUrl', fm."fileUrl", 
                      'fileSize', fm."fileSize", 
                      'fileHeight', fm."fileHeight", 
                      'fileWidth', fm."fileWidth",
                      'photoType', fm."photoType"
                    )
                  )
                `,
              )
              .from(FileMetadata, 'fm')
              .leftJoin(BlogImage, 'bi', 'bi.id = fm."blogImgId"')
              .where('bi."blogId"::text = blog.id::text'),
          'images',
        );

      const result = await queryBuilder.getRawOne();

      return getBlogsViewModel(result);
    } catch (error) {
      console.log(`Some troubles occurred during find blog by id${error}`);
      return null;
    }
  }

  async getBlogWithUserInfo(
    blogId: string,
  ): Promise<(BlogViewModelType & { user: UserAccount }) | null> {
    try {
      const result = await this.blogs.findOne({
        where: { id: blogId },
        relations: {
          user: true,
        },
      });

      if (!result) return null;
      const viewModel = getBlogsViewModel(result);
      viewModel['user'] = result.user;

      return viewModel as BlogViewModelType & { user: UserAccount };
    } catch (error) {
      console.log(`Some troubles occurred during find blog by id${error}`);
      return null;
    }
  }
}
