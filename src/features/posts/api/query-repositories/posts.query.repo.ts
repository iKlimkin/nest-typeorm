import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LikesStatuses } from '../../../../domain/reaction.models';
import { PaginationViewModel } from '../../../../domain/sorting-base-filter';
import { getPagination } from '../../../../infra/utils/get-pagination';
import { PostReaction } from '../../domain/entities/post-reactions.entity';
import { Post } from '../../domain/entities/post.entity';
import { PostsQueryFilter } from '../models/output.post.models/posts-query.filter';
import { PostViewModelType } from '../models/post.view.models/post-view-model.type';
import { getPostViewModel } from '../models/post.view.models/post-view.model';
import { Blog } from '../../../blogs/domain/entities/blog.entity';

@Injectable()
export class PostsQueryRepo {
  constructor(
    @InjectRepository(Post) private readonly posts: Repository<Post>,
    @InjectRepository(PostReaction)
    private readonly postReactions: Repository<PostReaction>,
  ) {}

  async getAllPosts(
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
        .where('posts.content ILIKE :content', { content: searchTerm })
        .leftJoin('posts.blog', 'blog')
        .leftJoin('posts.postReactionCounts', 'reactionCounter')
        .addSelect([
          'blog.id',
          'reactionCounter.likes_count',
          'reactionCounter.dislikes_count',
        ])
        .orderBy(
          sortBy === 'blog_id'
            ? 'posts.blog.id'
            : sortBy === 'created_at'
              ? `posts.created_at`
              : `posts.${sortBy}`,
          sortDirection,
        )
        .skip(skip)
        .take(pageSize);

      const [posts, count] = await queryBuilder.getManyAndCount();

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
        .select(['pr.user_login', 'pr.created_at'])
        .leftJoin('pr.post', 'post')
        .addSelect('post.id')
        .leftJoin('pr.user', 'user')
        .addSelect('user.id')
        .where('pr.reaction_type = :reactionType', {
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

  async getPostsByBlogId(
    blogId: string,
    queryOptions: PostsQueryFilter,
    userId?: string,
  ): Promise<PaginationViewModel<PostViewModelType> | null> {
    try {
      const { searchContentTerm } = queryOptions;

      const { pageNumber, pageSize, skip, sortBy, sortDirection } =
        getPagination(queryOptions);

      const searchTerm = `%${searchContentTerm ? searchContentTerm : ''}%`;

      const queryBuilder = this.posts.createQueryBuilder('posts');

      queryBuilder
        .where('posts.content ILIKE :searchTerm', { searchTerm })
        .andWhere('posts.blogId = :blogId', { blogId })
        // .leftJoin('posts.blog', 'blog')
        .leftJoin(
          (qb) =>
            qb
              .select('blog.id', 'id')
              .addSelect('blog.title', 'title')
              .from(Blog, 'blog'),
          'blog',
          'blog.id = posts.blogId',
          // { is_membership: true } 
        )
        .leftJoin('posts.postReactionCounts', 'reactionCounter')
        .addSelect([
          'blog.id',
          'reactionCounter.likes_count',
          'reactionCounter.dislikes_count',
        ])
        .orderBy(
          sortBy === 'blog_id'
            ? 'blog.id'
            : 'created_at'
              ? `posts.created_at`
              : `posts.${sortBy}`,
          sortDirection,
        )
        .skip(skip)
        .take(pageSize);

      const result = await queryBuilder.getManyAndCount();

      const posts = result[0];
      const postsCount = result[1];

      let myReactions: PostReaction[];

      if (userId) {
        const reactions = await this.postReactions.find({
          where: {
            user: {
              id: userId,
            },
            post: {
              blogId,
            },
          },
          relations: ['post'],
        });

        myReactions = reactions ? reactions : [];
      }

      const latestReactions = await this.postReactions
        .createQueryBuilder('pr')
        .select(['pr.user_login', 'pr.created_at'])
        .leftJoin('pr.post', 'posts')
        .addSelect('posts.id')
        .leftJoin('pr.user', 'user')
        .addSelect('user.id')
        .where('pr.reaction_type = :reactionType', {
          reactionType: LikesStatuses.Like,
        })
        .andWhere('posts.blog_id = :blogId', { blogId })
        .orderBy('pr.created_at', 'DESC')
        .getMany();

      const postsViewModel = new PaginationViewModel<PostViewModelType>(
        posts.map((post: Post) =>
          getPostViewModel(post, latestReactions, myReactions),
        ),
        pageNumber,
        pageSize,
        postsCount,
      );

      return postsViewModel;
    } catch (e) {
      console.error(`Database fails operation with find posts by blogId ${e}`);
      return null;
    }
  }

  async getPostById(
    postId: string,
    userId?: string,
  ): Promise<PostViewModelType | null> {
    try {
      let myReaction: LikesStatuses = LikesStatuses.None;

      const queryBuilder = this.posts.createQueryBuilder('posts');

      queryBuilder
        .where('posts.id = :postId', { postId })
        .leftJoinAndSelect('posts.postReactionCounts', 'prc')
        .leftJoin(
          (qb) =>
            qb
              .select('blog.id', 'id')
              .addSelect('blog.title', 'title')
              .from(Blog, 'blog'),
          'blog',
          'blog.id = posts.blogId',
          // { is_membership: true } 
        )
        .addSelect('b.id');

      const post = await queryBuilder.getOne();
        
      if (!post) return null;

      const latestReactions = await this.postReactions
        .createQueryBuilder('pr')
        .select([
          'pr.reaction_type',
          'pr.user_login',
          'pr.created_at',
          'pr.post_id',
          'post.id',
        ])
        .leftJoin('pr.user', 'user')
        .addSelect('user.id')
        .leftJoin('pr.post', 'post')
        .where('pr.post_id = :postId', { postId })
        .andWhere('pr.reaction_type = :reactionType', {
          reactionType: LikesStatuses.Like,
        })
        .orderBy('pr.created_at', 'DESC')
        .limit(3)
        .getMany();

      if (userId) {
        const reaction = await this.postReactions.findOne({
          where: {
            post: {
              id: postId,
            },
            user: {
              id: userId,
            },
          },
          relations: ['post'],
        });

        myReaction = reaction ? reaction.reaction_type : LikesStatuses.None;
      }

      return getPostViewModel(post, latestReactions, myReaction);
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
        .select(['pr.user_login', 'pr.created_at'])
        .leftJoin('pr.post', 'post')
        .addSelect('post.id')
        .leftJoin('pr.user', 'user')
        .addSelect('user.id')
        .where('pr.reaction_type = :reactionType', {
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
