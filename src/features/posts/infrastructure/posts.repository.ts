import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import {
  LikesStatuses,
  ReactionPostDto,
} from '../../../domain/reaction.models';
import { UpdatePostDto } from '../api/models/input.posts.models/create.post.model';
import { PostReaction } from '../domain/entities/post-reactions.entity';
import { Post } from '../domain/entities/post.entity';

@Injectable()
export class PostsRepository {
  constructor(
    @InjectRepository(Post) private readonly posts: Repository<Post>,
    @InjectRepository(PostReaction)
    private readonly postReactions: Repository<PostReaction>,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  async save(post: Post, manager: EntityManager): Promise<Post> {
    try {
      return await manager.save(Post, post);
    } catch (error) {
      throw new Error(`post is not saved: ${error}`);
    }
  }

  async getUserReaction(
    userId: string,
    postId: string,
  ): Promise<LikesStatuses | null> {
    try {
      const result = await this.postReactions
        .createQueryBuilder('pr')
        .select('pr.reactionType')
        .where('pr.user = :userId', { userId })
        .andWhere('pr.post = :postId', { postId })
        .getOne();

      if (!result) return null;

      return result.reactionType;
    } catch (error) {
      console.log(
        `Database fails operate with find user's reactions on post${error}`,
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
        { title, content, shortDescription: shortDescription },
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
          userLogin: userLogin,
          user: { id: userId },
          post: { id: postId },
          reactionType: inputStatus as LikesStatuses,
        })
        .orUpdate(['reactionType'], ['userId', 'postId'])
        .execute();

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
        `Database fails during create post reaction operate ${error}`,
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

  async getPost(postId: string): Promise<Post | null> {
    try {
      return await this.posts.findOneBy({ id: postId });
    } catch (error) {
      console.log(`Database fails during find post operation ${error.message}`);
      return null;
    }
  }
}
