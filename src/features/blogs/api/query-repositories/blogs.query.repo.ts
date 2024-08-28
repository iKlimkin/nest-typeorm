import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  PaginationResponseModel,
  PaginationViewModel,
} from '../../../../domain/sorting-base-filter';
import { getPagination } from '../../../../infra/utils/get-pagination';
import { UserAccount } from '../../../admin/domain/entities/user-account.entity';
import { CommentsQueryFilter } from '../../../comments/api/models/output.comment.models/comment-query.filter';
import { Comment } from '../../../comments/domain/entities/comment.entity';
import { BlogImage } from '../../../files/domain/entities/blog-images.entity';
import { FileMetadata } from '../../../files/domain/entities/file-metadata.entity';
import { getMembershipPlansViewModel } from '../../../integrations/payments/api/models/view/blog-payment-plans.view-model';
import {
  getMembershipPayments,
  MembershipPlanType,
  UserPaymentsViewType,
} from '../../../integrations/payments/api/models/view/user-payments.view-model';
import { BlogNotifySubscription } from '../../domain/entities/blog-subscription.entity';
import { Blog } from '../../domain/entities/blog.entity';
import { BlogsQueryFilter } from '../models/input.blog.models/blogs-query.filter';
import {
  AllCommentsForUserBlogsViewType,
  BlogViewModelType,
  BlogViewModelTypeWithImages,
  SABlogsViewType,
  SubscribeEnum,
} from '../models/output.blog.models/blog.view.model-type';
import {
  getBlogsViewModel,
  getBlogsViewModelNew,
  getSABlogsViewModelFromRaw,
  getSACommentsForBlogsCurrentUserViewModelFromRaw,
} from '../models/output.blog.models/blogs.view.model';
import { UserPaymentsQueryFilter } from '../../../integrations/payments/api/models/input/payments-query-filter';
import { MembershipBlogPlan } from '../../../integrations/payments/domain/entities/membership-blog-plan.entity';

@Injectable()
export class BlogsQueryRepo {
  constructor(
    @InjectRepository(Blog) private readonly blogsRepo: Repository<Blog>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async getAllCommentsForUserBlogs(
    userId: string,
    queryOptions: CommentsQueryFilter,
  ): PaginationResponseModel<AllCommentsForUserBlogsViewType> {
    const { pageNumber, pageSize, skip, sortBy, sortDirection } =
      getPagination(queryOptions);

    const [content] = [`%${queryOptions.searchContentTerm || ''}%`];

    const queryBuilder = this.dataSource
      .getRepository(Comment)
      .createQueryBuilder('comment');
    const blogQueryBuilder = this.blogsRepo.createQueryBuilder('blogsRepo');

    queryBuilder
      .leftJoin('comment.post', 'posts')
      .addSelect(['posts.id', 'posts.title', 'posts.blogId', 'posts.blogTitle'])
      .leftJoin('posts.blog', 'blogsRepo')
      .leftJoin('comment.user', 'user')
      .addSelect('user.id')
      .where('blogsRepo.user = :userId', { userId })
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
    userId?: string,
    adminAccess = false,
  ): PaginationResponseModel<BlogViewModelType | SABlogsViewType> {
    try {
      const { searchNameTerm } = queryOptions;

      const { pageNumber, pageSize, skip, sortBy, sortDirection } =
        getPagination(queryOptions);

      const [title] = [`%${searchNameTerm || ''}%`];

      const queryBuilder = this.blogsRepo.createQueryBuilder('blog');

      queryBuilder
        .select([
          'blog.id AS id',
          'blog.title AS title',
          'blog.description AS description',
          `blog.websiteUrl AS "websiteUrl"`,
          'blog.created_at AS created_at',
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
        .addSelect((qb) =>
          qb
            .select('COUNT(*) "subscribersCount"')
            .from(BlogNotifySubscription, 'subs')
            .where('subs."blogId" = blog.id')
            .andWhere('subs."subscribeStatus" = :subStatus', {
              subStatus: SubscribeEnum.Subscribed,
            }),
        )
        .skip(skip)
        .take(pageSize);

      if (userId) {
        queryBuilder
          .addSelect((qb) =>
            qb
              .select('sub."subscribeStatus"')
              .from(BlogNotifySubscription, 'sub')
              .where('sub."blogId" = blog.id AND sub."userId" = :userId', {
                userId,
              }),
          )
          .addSelect((qb) =>
            qb
              .select(
                `
                (CASE WHEN EXISTS(
                  SELECT 1
                  FROM membership_blog_plan mPlan
                  WHERE mPlan.user = :userId 
                  AND mPlan.blogId = blog.id
                ) THEN true ELSE false END)
              `,
                'isMembership',
              )
              .from(MembershipBlogPlan, 'mPlan'),
          );
      }

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
        blogs.map(getBlogsViewModelNew),
        pageNumber,
        pageSize,
        blogsCount,
      );
    } catch (error) {
      console.error(error);
      throw new Error(
        `Some troubles occurred during find or paging blogsRepo: ${error}`,
      );
    }
  }

  async getBlogsByBlogger(
    userId: string,
    queryOptions: BlogsQueryFilter,
  ): PaginationResponseModel<BlogViewModelTypeWithImages> {
    try {
      const { searchNameTerm } = queryOptions;

      const { pageNumber, pageSize, skip, sortBy, sortDirection } =
        getPagination(queryOptions);

      const [title] = [`%${searchNameTerm || ''}%`];

      const queryBuilder = this.blogsRepo.createQueryBuilder('b');

      queryBuilder
        .select([
          'b.id AS id',
          'b.title AS title',
          'b.description AS description',
          `b.websiteUrl AS "websiteUrl"`,
          'b.created_at AS created_at',
          `b.banDate as "banDate"`,
          `'true' AS "isMembership"`,
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
        .addSelect((qb) =>
          qb
            .select('COUNT(*) "subscribersCount"')
            .from(BlogNotifySubscription, 'subs')
            .where('subs."blogId" = b.id')
            .andWhere('subs."subscribeStatus" = :subStatus', {
              subStatus: SubscribeEnum.Subscribed,
            }),
        );
      queryBuilder
        .addSelect((qb) =>
          qb
            .select('sub."subscribeStatus"')
            .from(BlogNotifySubscription, 'sub')
            .where('sub."blogId" = b.id AND sub."userId" = :userId', {
              userId,
            }),
        )
        .skip(skip)
        .take(pageSize);

      const blogsRepo = await queryBuilder.getRawMany();
      const blogsCount = await queryBuilder.getCount();

      return new PaginationViewModel<BlogViewModelType>(
        blogsRepo.map(getBlogsViewModelNew),
        pageNumber,
        pageSize,
        blogsCount,
      );
    } catch (error) {
      console.error(error);
      throw new Error(
        `Some troubles occurred during find or paging blogsRepo by blogger: ${error}`,
      );
    }
  }

  async getById(
    blogId: string,
    userId?: string,
  ): Promise<BlogViewModelType | null> {
    try {
      const queryBuilder = this.blogsRepo.createQueryBuilder('blog');
      queryBuilder
        .select([
          'blog.id AS id',
          'blog.title AS title',
          'blog.description AS description',
          `blog.websiteUrl AS "websiteUrl"`,
          'blog.created_at AS created_at',
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
        )
        .addSelect((qb) =>
          qb
            .select('COUNT(*) as "subscribersCount"')
            .from(BlogNotifySubscription, 'sub')
            .where(
              'sub."blogId" = :blogId AND sub.subscribeStatus = :subStatus',
              { blogId, subStatus: SubscribeEnum.Subscribed },
            ),
        );

      if (userId) {
        queryBuilder
          .addSelect((qb) =>
            qb
              .select('sub."subscribeStatus"')
              .from(BlogNotifySubscription, 'sub')
              .where('sub."blogId" = :blogId AND sub."userId" = :userId', {
                blogId,
                userId,
              }),
          )
          .addSelect((qb) =>
            qb
              .select(
                `
                  (CASE WHEN EXISTS(
                    SELECT 1
                    FROM membership_blog_plan mPlan
                    WHERE mPlan.blog = :blogId AND mPlan.user = :userId
                  ) THEN true ELSE false END)
                `,
                'isMembership',
              )
              .from(MembershipBlogPlan, 'mPlan'),
          );
      }

      const result = await queryBuilder.getRawOne();

      return getBlogsViewModelNew(result);
    } catch (error) {
      console.log(`Some troubles occurred during find blog by id${error}`);
      return null;
    }
  }

  async getBlogWithUserInfo(
    blogId: string,
  ): Promise<(BlogViewModelType & { user: UserAccount }) | null> {
    try {
      const result = await this.blogsRepo.findOne({
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

  getMembershipPlansForSpecificBlog = async (
    blogId: string,
  ): Promise<MembershipPlanType[]> => {
    try {
      const queryBuilder = this.blogsRepo.createQueryBuilder('blog');

      queryBuilder
        .select('blog.id')
        .leftJoin('blog.subscriptionPlanModels', 'plan')
        .addSelect([
          'plan.productId',
          'plan.productPlan',
          'plan.productCurrency',
          'plan.productPrice',
        ])
        .where('plan."blogId" = :blogId', { blogId });

      const blogPlans = await queryBuilder.getOne();

      if (!blogPlans) return null;

      return getMembershipPlansViewModel(blogPlans.subscriptionPlanModels);
    } catch (error) {
      throw new Error('getMembershipPlansForSpecificBlog: ' + error);
    }
  };

  async getAllMembershipPayments(
    blogId: string,
    query: UserPaymentsQueryFilter,
  ): PaginationResponseModel<UserPaymentsViewType> {
    try {
      const { pageNumber, pageSize, skip, sortBy, sortDirection } =
        getPagination(query);
      const queryBuilder = this.dataSource
        .getRepository(MembershipBlogPlan)
        .createQueryBuilder('memberPlan');

      queryBuilder
        .select('memberPlan.id as "planId"')
        .leftJoin('memberPlan.blog', 'blog')
        .addSelect(['blog.id as "blogId"', 'blog.title as "blogTitle"'])
        .leftJoin('memberPlan.user', 'user')
        .addSelect(['user.login as "userLogin"', 'user.id as "userId"'])
        .leftJoin('memberPlan.blogPlanModel', 'planModel')
        .addSelect([
          'planModel.productPrice as "price"',
          'planModel.productCurrency as "currency"',
          'planModel.productPlan as "plan"',
        ])
        .where('memberPlan.blog = :blogId', { blogId })
        .orderBy(
          sortBy === 'title'
            ? 'blog."title" COLLATE "C"'
            : sortBy === 'created_at'
            ? 'memberPlan.created_at'
            : `memberPlan.${sortBy}`,
          sortDirection,
        )
        .skip(skip)
        .take(pageSize);

      const memberPlans = await queryBuilder.getRawMany();
      const membershipPlansCount = await queryBuilder.getCount();

      return new PaginationViewModel<UserPaymentsViewType>(
        memberPlans.map(getMembershipPayments),
        pageNumber,
        pageSize,
        membershipPlansCount,
      );
    } catch (error) {
      throw new Error('getMembershipPaymentsCurrentBlog: ' + error);
    }
  }
}
