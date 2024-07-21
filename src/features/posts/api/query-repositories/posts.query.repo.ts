import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { LikesStatuses } from '../../../../domain/reaction.models';
import { PaginationViewModel } from '../../../../domain/sorting-base-filter';
import { getPagination } from '../../../../infra/utils/get-pagination';
import { PostReaction } from '../../domain/entities/post-reactions.entity';
import { Post } from '../../domain/entities/post.entity';
import { PostsQueryFilter } from '../models/output.post.models/posts-query.filter';
import {
  PostViewModelType,
  PostWithNewestLikes,
  PostWithNewestLikesRaw,
} from '../models/post.view.models/post-view-model.type';
import {
  getPostRawView,
  getPostViewModel,
  parsePostToView,
} from '../models/post.view.models/post-view.model';
import { Blog } from '../../../blogs/domain/entities/blog.entity';

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

  async getAllPosts(
    queryOptions: PostsQueryFilter,
    userId?: string,
  ): Promise<PaginationViewModel<PostViewModelType>> {
    const { pageNumber, pageSize, skip, sortBy, sortDirection } =
      getPagination(queryOptions);

    const searchTerm = `%${queryOptions.searchContentTerm || ''}%`;

    const postQueryBuilder = this.posts.createQueryBuilder('post');

    postQueryBuilder
      .where('post.content ILIKE :content', { content: searchTerm })
      .leftJoin('post.blog', 'blog')
      .orderBy(
        sortBy === 'blog_id'
          ? 'post.blogId'
          : sortBy === 'created_at'
          ? `post.created_at`
          : `post.${sortBy}`,
        sortDirection,
      )
      .skip(skip)
      .take(pageSize);

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

    const searchTerm = `%${queryOptions.searchContentTerm || ''}%`;

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

      // add array in query
      queryBuilder
        .where('posts.content ILIKE :searchTerm', { searchTerm })
        .andWhere('posts.blogId = :blogId', { blogId })
        .leftJoin(
          (qb) => qb.select('blog.id', 'id').from(Blog, 'blog'),
          'blog',
          'blog.id = posts.blogId',
          // { is_membership: true }
        )
        .addSelect('blog.id', 'blogId')
        // .leftJoinAndMapMany(
        //   'posts.latestLikeReactions',
        //   (qb) =>
        //     qb
        //       .select(['pr.userLogin', 'pr.created_at'])
        //       .from(PostReaction, 'pr')
        //       .where("pr.reactionType = 'Like'")
        //       .leftJoin('pr.post', 'posts')
        //       .andWhere('pr. = posts.id')
        //       .leftJoin('pr.user', 'user')
        //       .addSelect(['user.id'])
        //       .leftJoin('user.userBans', 'bans')
        //       .andWhere('bans IS NULL OR bans.isBanned <> true')
        //       .orderBy('pr.created_at', 'DESC')
        //       .limit(3),
        //   'latestLikeReactions',
        //   // 'latestLikeReactions.postId = posts.id'
        // )
        .orderBy(
          sortBy === 'blog_id'
            ? 'posts.blogId'
            : 'created_at'
            ? `posts.created_at`
            : `posts.${sortBy}`,
          sortDirection,
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

      const [posts, postsCount] = await queryBuilder.getManyAndCount();

      const latestLikeReactions = await this.postReactions
        .createQueryBuilder('pr')
        .select(['pr.userLogin', 'pr.created_at'])
        .where("pr.reactionType = 'Like'")
        .leftJoin('pr.post', 'posts')
        .addSelect('posts.id')
        .leftJoin('posts.blog', 'blog')
        .andWhere('blog.id = :blogId', { blogId })
        .leftJoin('pr.user', 'user')
        .addSelect(['user.id'])
        .leftJoin('user.userBans', 'bans')
        .andWhere('bans IS NULL OR bans.isBanned = false')
        .orderBy('pr.created_at', 'DESC')
        .limit(3)
        .getMany();

      // const postsQueryBuilder = this.posts.createQueryBuilder('posts');

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

      // postsQueryBuilder
      //   .select('posts.id')
      //   .leftJoin('posts.postReactionCounts', 'reactionCounter')
      //   .addSelect([
      //     'reactionCounter.likes_count',
      //     'reactionCounter.dislikes_count',
      //   ])
      //   .leftJoin('posts.blog', 'blog')
      //   .where('blog.id = :blogId', { blogId })
      //   .leftJoin('blog.user', 'user')
      //   .leftJoin('user.userBans', 'bans')
      //   .andWhere('bans IS NULL OR bans.isBanned = false')
      //   .orderBy(
      //     sortBy === 'blog_id'
      //       ? 'blog.id'
      //       : 'created_at'
      //       ? `posts.created_at`
      //       : `posts.${sortBy}`,
      //     sortDirection,
      //   );

      // const reactionsCounter = await postsQueryBuilder.getMany();

      // const reactionsCounterMap = new Map();
      // reactionsCounter.forEach((counter) => {
      //   reactionsCounterMap.set(counter.id, counter);
      // });
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
                  ) AS "postReactions"
                FROM post p
                LEFT JOIN post_reaction pr on pr."postId" = p.id
                LEFT JOIN user_account u ON pr."userId" = u.id
                LEFT JOIN user_bans bans ON u.id = bans."userId"
                WHERE p.id = $1
                GROUP BY p.id, bans.id
              `;

      const [post] = await this.dataSource.query(query, [postId, userId]);

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

      queryBuilder
        .where('posts.content ILIKE :searchTerm', { searchTerm })
        .leftJoin('posts.blog', 'blog')
        .leftJoinAndSelect('posts.postReactionCounts', 'counts')
        .addSelect('blog.id')
        .orderBy(
          sortBy !== 'created_at'
            ? `posts.${sortBy} COLLATE 'C'`
            : `posts.created_at`,
          sortDirection,
        )
        .skip(skip)
        .take(pageSize);

      const result = await queryBuilder.getManyAndCount();

      const posts = result[0];
      const count = result[1];

      let myReactions: PostReaction[];

      if (userId) {
        const reactions = await this.postReactions.find({
          where: {
            user: {
              id: userId,
            },
          },
          relations: ['post'],
        });

        myReactions = reactions ? reactions : [];
      }

      const latestReactions = await this.postReactions
        .createQueryBuilder('pr')
        .select(['pr.userLogin', 'pr.created_at'])
        .leftJoin('pr.post', 'post')
        .addSelect('post.id')
        .leftJoin('pr.user', 'user')
        .addSelect('user.id')
        .where('pr.reactionType = :reactionType', {
          reactionType: LikesStatuses.Like,
        })
        .orderBy('pr.created_at', 'DESC')
        .getMany();

      const postsViewModel = new PaginationViewModel<PostViewModelType>(
        posts.map((post: Post) =>
          getPostViewModel(post, latestReactions, myReactions),
        ),
        pageNumber,
        pageSize,
        count,
      );

      return postsViewModel;
    } catch (error) {
      throw new InternalServerErrorException(
        `Database fails operation with find all posts ${error}`,
      );
    }
  }
}
