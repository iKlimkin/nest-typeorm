import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  ReactionPostDto,
  LikesStatuses,
} from '../../../domain/reaction.models';
import { UpdatePostDto } from '../api/models/input.posts.models/create.post.model';
import { PostCreationDto } from '../api/models/dto/post-sql.model';
import { PostReactionCounts } from '../domain/entities/post-reaction-counts.entity';
import { PostReaction } from '../domain/entities/post-reactions.entity';
import { Post } from '../domain/entities/post.entity';
import { OutputId } from '../../../domain/output.models';

@Injectable()
export class PostsRepository {
  constructor(
    @InjectRepository(Post) private readonly posts: Repository<Post>,
    @InjectRepository(PostReactionCounts)
    private readonly postReactions: Repository<PostReaction>,
    @InjectDataSource() private dataSource: DataSource
  ) {}

  async createPost(
    postDto: Readonly<PostCreationDto>
  ): Promise<OutputId | null> {
    try {
      const post = this.posts.create({
        title: postDto.createPostDto.title,
        short_description: postDto.createPostDto.short_description,
        content: postDto.createPostDto.content,
        blog_title: postDto.createPostDto.blog_title,
        blog: {
          id: postDto.createPostDto.blog_id,
        },
      });

      const result = await this.posts.save(post);

      return {
        id: result.id,
      };
    } catch (error) {
      console.error(`Database fails during save post sql operate ${error}`);
      return null;
    }
  }

  async getUserReaction(
    userId: string,
    postId: string
  ): Promise<LikesStatuses | null> {
    try {
      const result = await this.postReactions
        .createQueryBuilder('pr')
        .select('reaction_type')
        .where('pr.user_id = :userId', { userId })
        .andWhere('pr.post_id = :postId', { postId })
        .getRawOne();

      if (!result) return null;

      return result.reaction_type;
    } catch (error) {
      console.error(
        `Database fails operate with find user's reactions on post`
      );
      return null;
    }
  }

  async updatePost(updateData: UpdatePostDto): Promise<boolean> {
    try {
      const { content, shortDescription, title, postId } = updateData;

      const result = await this.posts.update(
        {
          id: postId,
        },
        { title, content, short_description: shortDescription }
      );

      return result.affected !== 0;
    } catch (error) {
      console.error(`Database fails during update post sql operate ${error}`);
      return false;
    }
  }

  async updateReactionType(reactionDto: ReactionPostDto) {
    try {
      const {
        dislikesCount,
        inputStatus,
        likesCount,
        postId,
        userId,
        userLogin,
      } = reactionDto;

      await this.postReactions
        .createQueryBuilder('postReactions')
        .insert()
        .values({
          user_login: userLogin,
          user: { id: userId },
          post: { id: postId },
          reaction_type: inputStatus as LikesStatuses,
        })
        .orUpdate(['reaction_type'], ['user_id', 'post_id'])
        .execute();

      // await this.postReactionCounts
      //   .createQueryBuilder('postReactionCounts')
      //   .insert()
      //   .values({
      //     post: {
      //       id: postId,
      //     },
      //     likes_count: likesCount,
      //     dislikes_count: dislikesCount,
      //   })
      //   .orUpdate(['likes_count', 'dislikes_count'], ['post_id'])
      //   .setParameters({
      //     excludedDislikesCount:` post_reaction_counts.likes_count + ${dislikesCount}`,
      //     excludedLikesCount: `post_reaction_counts.likes_count + ${likesCount}`,
      //   })
      //   .execute();

      const updateCounterQuery = `
      INSERT INTO post_reaction_counts (post_id, likes_count, dislikes_count)
      VALUES ($1, $2, $3)
      ON CONFLICT (post_id) DO UPDATE SET
        likes_count = post_reaction_counts.likes_count + EXCLUDED.likes_count,
        dislikes_count = post_reaction_counts.dislikes_count + EXCLUDED.dislikes_count
    `;

      await this.dataSource.query(updateCounterQuery, [
        postId,
        likesCount,
        dislikesCount,
      ]);
    } catch (error) {
      console.error(
        `Database fails during create post reaction operate ${error}`
      );
    }
  }

  async deletePost(postId: string): Promise<boolean> {
    try {
      const result = await this.posts.delete({ id: postId });

      return result.affected !== 0;
    } catch (error) {
      console.error(`Database fails during delete post sql operate ${error}`);
      return false;
    }
  }
}
