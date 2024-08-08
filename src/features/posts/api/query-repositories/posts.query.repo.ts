import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  PaginationViewModel,
  SortDirections,
} from '../../../../domain/sorting-base-filter';
import { getPagination } from '../../../../infra/utils/get-pagination';
import { Blog } from '../../../blogs/domain/entities/blog.entity';
import { PostReaction } from '../../domain/entities/post-reactions.entity';
import { Post } from '../../domain/entities/post.entity';
import { PostsQueryFilter } from '../models/output.post.models/posts-query.filter';
import {
  IPostWithImagesRaw,
  PostViewModelType,
  PostWithNewestLikes,
} from '../models/post.view.models/post-view-model.type';
import { parsePostToView } from '../models/post.view.models/post-view.model';
import { PostImage } from '../../../files/domain/entities/post-images.entity';
import { FileMetadata } from '../../../files/domain/entities/file-metadata.entity';

interface IPostsByBlogId {
  blogId: string;
  queryOptions: PostsQueryFilter;
  userId?: string;
}

@Injectable()
export class PostsQueryRepo {
  constructor(
    @InjectRepository(Post) private readonly posts: Repository<Post>,
    @InjectRepository(PostReaction)
    private readonly postReactions: Repository<PostReaction>,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  async getPosts(
    queryOptions: PostsQueryFilter,
    userId?: string,
  ): Promise<PaginationViewModel<PostViewModelType>> {
    try {
      const { pageNumber, pageSize, skip, sortBy, sortDirection } =
        getPagination(queryOptions);

      //
      const queryBuilder = this.posts.createQueryBuilder('post');

      queryBuilder
        // // COUNT LIKES
        // .addSelect(
        //   (qb) =>
        //     qb
        //       .select('COUNT(*)')
        //       .from(PostReaction, 'pr')
        //       .where('pr.postId = post.id')
        //       .leftJoin('pr.user', 'user')
        //       .leftJoin('user.userBan', 'bans')
        //       .where('bans.isBanned = false')
        //       .andWhere('pr.reactionType = Like'),
        //   'likesCount',
        // ) // COUNT DIS
        // .addSelect(
        //   (qb) =>
        //     qb
        //       .select('COUNT(*)')
        //       .from(PostReaction, 'pr')
        //       .where('pr.postId = post.id')
        //       .leftJoin('pr.user', 'user')
        //       .leftJoin('user.userBan', 'bans')
        //       .where('bans.isBanned = false')
        //       .andWhere('pr.reactionType = Dislike'),
        //   'dislikesCount',
        // )
        // .addSelect(
        //   (qb) =>
        //     qb
        //       .select('pr.reactionType')
        //       .from(PostReaction, 'pr')
        //       .where('pr.postId = post.id')
        //       .andWhere('pr.userId = :userId', { userId }),
        //   'myStatus',
        // )
        .leftJoinAndSelect('post.blog', 'blog')
        .andWhere('blog.isBanned = false')
        .leftJoinAndSelect('blog.user', 'user')
        .leftJoinAndSelect('user.userBan', 'bans')
        .andWhere('(bans.isBanned = false OR bans.isBanned = NULL)')
        .offset(skip)
        .limit(pageSize);
      console.log(queryBuilder.getQueryAndParameters());

      const posts = await queryBuilder.getRawMany();

      return new PaginationViewModel<PostViewModelType>(
        posts.map(parsePostToView),
        pageNumber,
        pageSize,
        1,
      );
    } catch (error) {
      console.error(`error in getPosts: ${error}`);
      throw error;
    }
  }

  async getAllPosts(
    queryOptions: PostsQueryFilter,
    userId?: string,
  ): Promise<PaginationViewModel<PostViewModelType>> {
    const { pageNumber, pageSize, skip, sortBy, sortDirection } =
      getPagination(queryOptions);

    const [content] = [`%${queryOptions.searchContentTerm || ''}%`];

    const postQueryBuilder = this.posts.createQueryBuilder('post');

    postQueryBuilder
      .where('post.content ILIKE :content', { content })
      .leftJoin('post.blog', 'blog')
      .andWhere('blog.isBanned = false')
      .orderBy(
        sortBy !== 'created_at' && sortBy !== 'blogId'
          ? `post.${sortBy} COLLATE "C"`
          : `post.${sortBy}`,
        sortDirection,
      )
      .offset(skip)
      .limit(pageSize);

    if (userId) {
      postQueryBuilder
        .leftJoin('post.postReactions', 'pr', 'pr.userId = :userId', {
          userId,
        })
        .addSelect('pr.reactionType');
    }

    try {
      const [posts, count] = await postQueryBuilder.getManyAndCount();

      const postsWithReactionsAndCounts = (await Promise.all(
        posts.map(async (post) => {
          const query = `
                SELECT 
                COUNT(
                  CASE 
                    WHEN pr."reactionType" = 'Like' THEN 1 
                    ELSE NULL 
                  END
                ) AS "likesCount",
                COUNT(
                  CASE 
                    WHEN pr."reactionType" = 'Dislike' THEN 1 
                    ELSE NULL 
                  END
                ) AS "dislikesCount",
               (
                  SELECT COALESCE(
                    json_agg(
                      json_build_object(
                        'addedAt', sub_pr."created_at",
                        'userId', sub_pr."userId",
                        'login', sub_pr."userLogin"
                      )
                    ), 
                    '[]'
                  )
                  FROM (
                    SELECT pr."userLogin", pr."created_at", pr."userId"
                    FROM post_reaction pr
                    LEFT JOIN user_account u ON pr."userId" = u.id
                    LEFT JOIN user_bans bans ON u.id = bans."userId"
                    WHERE pr."postId" = $1
                      AND pr."reactionType" = 'Like'
                      AND (bans."isBanned" IS NULL OR bans."isBanned" = false)
                    ORDER BY pr."created_at" DESC
                    LIMIT 3
                  ) sub_pr
                ) AS "newestLikes"
                FROM post_reaction pr
                LEFT JOIN user_account u ON pr."userId" = u.id
                LEFT JOIN user_bans bans ON u.id = bans."userId"
                WHERE pr."postId" = $1
                AND (bans."isBanned" IS NULL OR bans."isBanned" = false)
                GROUP BY pr."postId"
              `;

          let result = await this.dataSource.query(query, [post.id]);

          if (!result.length) {
            return {
              ...post,
              postReactionCounts: {
                likesCount: 0,
                dislikesCount: 0,
              },
              newestLikes: [],
            };
          }

          const { likesCount, dislikesCount, newestLikes } = result[0];

          return {
            ...post,
            postReactionCounts: {
              likesCount: parseInt(likesCount, 10),
              dislikesCount: parseInt(dislikesCount, 10),
            },
            newestLikes: newestLikes || [],
          };
        }),
      )) as unknown as PostWithNewestLikes[];

      return new PaginationViewModel<PostViewModelType>(
        postsWithReactionsAndCounts.map(parsePostToView),
        pageNumber,
        pageSize,
        count,
      );
    } catch (error) {
      console.log(`Database fails operation with find all posts ${error}`);
      return null;
    }
  }

  async getPostsByBlogId(
    inputData: IPostsByBlogId,
  ): Promise<PaginationViewModel<PostViewModelType> | null> {
    const { blogId, queryOptions, userId } = inputData;

    const { pageNumber, pageSize, skip, sortBy, sortDirection } =
      getPagination(queryOptions);

    const [searchTerm] = [`%${queryOptions.searchContentTerm || ''}%`];

    try {
      // how to solve issue with raw query

      // let postsWithNewestLikesQuery = `
      //   SELECT
      //     p.id,
      //     p.title,
      //     p."shortDescription",
      //     p.content,
      //     p."blogId",
      //     p."blogTitle",
      //     p.created_at "createdAt",
      //   (
      //     SELECT json_agg(sub)
      //     FROM (
      //       SELECT pr."userLogin", pr.created_at "addedAt", u.id "userId"
      //       FROM post_reaction pr
      //       LEFT JOIN user_account u ON pr."userId" = u.id
      //       LEFT JOIN user_bans bans ON u.id = bans."userId"
      //       WHERE pr."postId" = p.id AND pr."reactionType" = 'Like' AND (bans IS NULL OR bans."isBanned" <> true)
      //       ORDER BY pr.created_at DESC
      //       LIMIT 3
      //     ) sub
      //   ) AS "newestLikes",
      //   prc.likes_count "likesCount",
      //   prc.dislikes_count "dislikesCount"
      // `;

      // if (!userId) {
      //   postsWithNewestLikesQuery += `
      //     ,(
      //       SELECT pr."reactionType"
      //       FROM post_reaction pr
      //       WHERE pr."postId" = p.id AND pr."userId" = '${userId}'
      //     ) AS "myReaction"
      //   `;
      // }

      // postsWithNewestLikesQuery += `
      //   FROM post p
      //   LEFT JOIN blog b ON p."blogId" = b.id
      //   LEFT JOIN post_reaction_counts prc ON p.id = prc.post_id
      //   WHERE p.content ILIKE $1 AND b.id = $2
      //   ORDER BY ${
      //     sortBy === 'blog_id'
      //       ? 'b.id'
      //       : 'blog_title'
      //       ? 'p."blogTitle"'
      //       : 'p.' + sortBy
      //   } ${sortDirection}
      //   LIMIT ${pageSize}
      //   OFFSET ${skip};
      // `;

      // const postsWithLikes = (await this.dataSource.query(
      //   postsWithNewestLikesQuery,
      //   [searchTerm, blogId],
      // )) as PostWithNewestLikesRaw[];

      // return new PaginationViewModel<PostViewModelType>(
      //   postsWithLikes.map(getPostRawView),
      //   pageNumber,
      //   pageSize,
      //   postsCount,
      // );

      const queryBuilder = this.posts.createQueryBuilder('posts');

      queryBuilder
        .select([
          'posts.id as id',
          'posts.title as title',
          `posts.shortDescription as "shortDescription"`,
          'posts.content as content',
          `posts.blogId as "blogId"`,
          `posts.blogTitle as "blogTitle"`,
          'posts.created_at as created_at',
        ])
        .where('posts.content ILIKE :searchTerm', { searchTerm })
        .andWhere('posts.blogId = :blogId', { blogId })
        .leftJoin('posts.blog', 'blog')
        .andWhere('blog."isBanned" = false')
        .addSelect('blog.id', 'blogId')
        .orderBy(
          sortBy === 'blog_id'
            ? 'posts.blogId'
            : 'created_at'
            ? `posts.created_at`
            : `posts.${sortBy}`,
          sortDirection,
        )
        .addSelect(
          (qb) =>
            qb
              .select(
                `
                json_agg(
                  json_build_object(
                    'fileUrl', meta."fileUrl", 
                    'fileSize', meta."fileSize", 
                    'fileHeight', meta."fileHeight", 
                    'fileWidth', meta."fileWidth"
                  )
                )
              `,
              )
              .from(FileMetadata, 'meta')
              .leftJoin(PostImage, 'image', 'image.id = meta."postImgId"')
              .where('posts.id = image."postId"'),
          'images',
        )
        .skip(skip)
        .take(pageSize);

      if (userId) {
        queryBuilder
          .leftJoin(
            'posts.postReactions',
            'postReaction',
            'postReaction.userId = :userId',
            { userId },
          )
          .addSelect('postReaction.reactionType');
      }

      const posts = await queryBuilder.getRawMany();
      const postsCount = await queryBuilder.getCount();

      const latestLikeReactions = await this.postReactions
        .createQueryBuilder('pr')
        .select(['pr.userLogin', 'pr.created_at'])
        .where("pr.reactionType = 'Like'")
        .leftJoin('pr.post', 'posts')
        .addSelect('posts.id')
        .leftJoin('posts.blog', 'blog')
        .andWhere('blog.id = :blogId AND blog.isBanned = false', { blogId })
        .leftJoin('pr.user', 'user')
        .addSelect(['user.id'])
        .leftJoin('user.userBan', 'ban')
        .andWhere('ban IS NULL OR ban.isBanned = false')
        .orderBy('pr.created_at', 'DESC')
        .limit(3)
        .getMany();

      const postsWithReactionCounts = await Promise.all(
        posts.map(async (post) => {
          const query = `
              SELECT 
                COUNT(
                  CASE WHEN pr."reactionType" = 'Like' THEN 1 
                  ELSE NULL 
                  END
                ) AS "likesCount",
                COUNT(
                  CASE 
                    WHEN pr."reactionType" = 'Dislike' THEN 1 
                    ELSE NULL 
                  END
                ) AS "dislikesCount"
              FROM post_reaction pr
              LEFT JOIN user_account u ON pr."userId" = u.id
              LEFT JOIN user_bans bans ON u.id = bans."userId"
              WHERE pr."postId" = $1
              AND (bans."isBanned" IS NULL OR bans."isBanned" = false)
            `;

          let [{ likesCount, dislikesCount }] = await this.dataSource.query(
            query,
            [post.id],
          );

          return {
            ...post,
            postReactionCounts: {
              likesCount: parseInt(likesCount, 10),
              dislikesCount: parseInt(dislikesCount, 10),
            },
          };
        }),
      );

      const newestLikesMap = new Map();
      latestLikeReactions.forEach((reaction) => {
        newestLikesMap.set(
          reaction.post.id,
          (newestLikesMap.get(reaction.post.id) || []).concat([
            {
              addedAt: reaction.created_at,
              userId: reaction.user.id,
              login: reaction.userLogin,
            },
          ]),
        );
      });

      const allPosts = postsWithReactionCounts.map((post) => {
        const newestLikes = newestLikesMap.get(post.id) || [];
        return {
          ...post,
          newestLikes,
        };
      });

      return new PaginationViewModel<PostViewModelType>(
        allPosts.map(parsePostToView),
        pageNumber,
        pageSize,
        postsCount,
      );
    } catch (e) {
      console.error(`Database fails operation with find posts by blogId ${e}`);
      return null;
    }
  }

  async getById(postId: string, userId?: string): Promise<PostViewModelType> {
    try {
      const query = `
                SELECT 
                p."shortDescription", 
                p."blogTitle", 
                p.created_at, 
                p."blogId", 
                p.content, 
                p.title, 
                p.id,
                json_build_object(
                  'likesCount', COALESCE(
                    SUM(
                      CASE 
                        WHEN pr."reactionType" = 'Like' AND (bans."isBanned" IS NULL OR bans."isBanned" = false) THEN 1 
                        ELSE 0 
                      END
                    ), 
                  0),
                  'dislikesCount', COALESCE(
                    SUM(
                      CASE 
                        WHEN pr."reactionType" = 'Dislike' AND (bans."isBanned" IS NULL OR bans."isBanned" = false) THEN 1   ELSE 0 
                      END
                    ), 
                  0)
                ) as "postReactionCounts",
               (
                  SELECT COALESCE(
                    json_agg(
                      json_build_object(
                        'addedAt', sub_pr."created_at",
                        'userId', sub_pr."userId",
                        'login', sub_pr."userLogin"
                      )
                    ), 
                    '[]'
                  )
                  FROM (
                    SELECT pr."userLogin", pr."created_at", pr."userId"
                    FROM post_reaction pr
                    LEFT JOIN user_account u ON pr."userId" = u.id
                    LEFT JOIN user_bans bans ON u.id = bans."userId"
                    WHERE pr."postId" = $1
                      AND pr."reactionType" = 'Like'
                      AND (bans."isBanned" IS NULL OR bans."isBanned" = false)
                    ORDER BY pr."created_at" DESC
                    LIMIT 3
                  ) sub_pr
                ) AS "newestLikes",
                (
                  SELECT COALESCE(
                    json_agg(
                      json_build_object('reactionType', pr."reactionType")
                    ), '[]'
                  )
                  FROM post_reaction pr
                  WHERE pr."postId" = $1
                    AND ($2::uuid IS NULL OR (pr."userId" = $2::uuid AND (bans."isBanned" IS NULL OR bans."isBanned" = false)))
                ) AS "postReactions",
                (
                  SELECT COALESCE(
                    json_agg(
                      json_build_object(
                        'fileUrl', meta."fileUrl",
                        'fileSize', meta."fileSize",
                        'fileHeight', meta."fileHeight",
                        'fileWidth', meta."fileWidth"
                      )
                    ), '[]'
                  )
                    FROM file_metadata meta
                    LEFT JOIN post_image image ON meta."postImgId" = image.id
                    WHERE image."postId" = $1
                ) as images
                FROM post p
                LEFT JOIN post_reaction pr on pr."postId" = p.id
                LEFT JOIN user_account u ON pr."userId" = u.id
                LEFT JOIN blog b ON p."blogId" = b.id
                LEFT JOIN user_bans bans ON u.id = bans."userId"
                WHERE p.id = $1 AND b."isBanned" = false
                GROUP BY p.id, bans.id
              `;

      const [post] = await this.dataSource.query(query, [postId, userId]);

      if (!post) return null;

      return parsePostToView(post);
    } catch (error) {
      console.error(`Database fails operate during find post ${error}`);
      return null;
    }
  }

  async getPostsForTest(
    queryOptions: PostsQueryFilter,
    userId?: string,
  ): Promise<PaginationViewModel<PostViewModelType>> {
    try {
      const { searchContentTerm } = queryOptions;

      const { pageNumber, pageSize, skip, sortBy, sortDirection } =
        getPagination(queryOptions);

      const searchTerm = `%${searchContentTerm ? searchContentTerm : ''}%`;

      const queryBuilder = this.posts.createQueryBuilder('posts');
    } catch (e) {
      console.error(`Database fails operation with find posts by blogId ${e}`);
      return null;
    }
  }
}
