import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  OutputId,
  ReactionPostDtoType,
  likesStatus,
} from '../../../domain/likes.types';
import { ReactionType } from '../../comments/api/models/output.comment.models/output.comment.models';
import { UpdatePostModel } from '../api/models/input.posts.models/create.post.model';
import { PostDtoSqlModel } from '../api/models/post-sql.model';

@Injectable()
export class PostsSqlRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async save(postDto: Readonly<PostDtoSqlModel>): Promise<OutputId | null> {
    try {
      const createQuery = `
        INSERT INTO posts (title, short_description, content, blog_id, blog_title)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `;

      const result = await this.dataSource.query(
        createQuery,
        Object.values(postDto.createPostDto),
      );

      return {
        id: result[0].id,
      };
    } catch (error) {
      console.error(`Database fails during save post sql operate ${error}`);
      return null;
    }
  }

  async getUserReaction(
    userId: string,
    postId: string,
  ): Promise<likesStatus | null> {
    try {
      const findQuery = `
      SELECT *
        FROM post_reactions
        WHERE user_id = $1 AND post_id = $2
      `;

      const result = await this.dataSource.query<ReactionType>(findQuery, [
        userId,
        postId,
      ]);

      if (!result) return null;

      return result[0].reaction_type;
    } catch (error) {
      console.error(
        `Database fails operate with find user's reactions on post`,
      );
      return null;
    }
  }

  async updatePost(
    postId: string,
    updateData: UpdatePostModel,
  ): Promise<boolean> {
    try {
      const { content, shortDescription, title } = updateData;

      const updateQuery = `
      UPDATE posts
        SET title = $1, short_description = $2, content = $3
        WHERE id = $4
      `;

      const result = await this.dataSource.query(updateQuery, [
        title,
        shortDescription,
        content,
        postId,
      ]);

      return result[1] > 0;
    } catch (error) {
      console.error(`Database fails during update post sql operate ${error}`);
      return false;
    }
  }

  async updateReactionType(reactionDto: ReactionPostDtoType) {
    try {
      const updateReactionQuery = `
      INSERT INTO post_reactions (user_id, user_login, post_id, reaction_type)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, post_id) DO UPDATE SET reaction_type = EXCLUDED.reaction_type
    `;

      const updatedReaction = await this.dataSource.query(updateReactionQuery, [
        reactionDto.userId,
        reactionDto.userLogin,
        reactionDto.postId,
        reactionDto.inputStatus,
      ]);

      const updateCounterQuery = `
      INSERT INTO post_reaction_counts (post_id, likes_count, dislikes_count)
      VALUES ($1, $2, $3)
      ON CONFLICT (post_id) DO UPDATE SET
        likes_count = post_reaction_counts.likes_count + EXCLUDED.likes_count,
        dislikes_count = post_reaction_counts.dislikes_count + EXCLUDED.dislikes_count
    `;

      const updatedReactionCounter = await this.dataSource.query(
        updateCounterQuery,
        [reactionDto.postId, reactionDto.likesCount, reactionDto.dislikesCount],
      );
    } catch (error) {
      console.error(
        `Database fails during create post reaction operate ${error}`,
      );
    }
  }

  async deletePost(postId: string): Promise<boolean> {
    try {
      const deleteQuery = `
      DELETE
        FROM posts
        WHERE id = $1
      `;

      const result = await this.dataSource.query(deleteQuery, [postId]);

      return result[1] > 0;
    } catch (error) {
      console.error(`Database fails during delete post sql operate ${error}`);
      return false;
    }
  }
}
