import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  LikesStatuses,
  ReactionCommentDto,
} from '../../../domain/reaction.models';
import { CommentReaction } from '../domain/entities/comment-reactions.entity';
import { Comment } from '../domain/entities/comment.entity';
import { OutputId } from '../../../domain/output.models';
import { CreationCommentDto } from '../api/models/dtos/comment.dto';

@Injectable()
export class FeedbacksRepository {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    @InjectRepository(Comment) private readonly comments: Repository<Comment>,
    @InjectRepository(CommentReaction)
    private readonly commentReactions: Repository<CommentReaction>,
  ) {}

  async createComment(
    commentDto: CreationCommentDto,
  ): Promise<OutputId | null> {
    try {
      const { content, postId, userId, userLogin } = commentDto.createData;

      const comment = this.comments.create({
        post: {
          id: postId,
        },
        userLogin: userLogin,
        user: {
          id: userId,
        },
        content,
      });

      const result = await this.comments.save(comment);

      return {
        id: result.id,
      };
    } catch (error) {
      console.error(`Database fails during save comment sql operate ${error}`);
      return null;
    }
  }

  async updateComment(commentId: string, content: string): Promise<boolean> {
    try {
      const result = await this.comments.update({ id: commentId }, { content });

      return result.affected !== 0;
    } catch (error) {
      console.error(`Database fails during update comment operation ${error}`);
      return false;
    }
  }

  async updateReactionType(reactionDto: ReactionCommentDto): Promise<void> {
    try {
      const { commentId, dislikesCount, inputStatus, likesCount, userId } =
        reactionDto;

      await this.commentReactions
        .createQueryBuilder()
        .insert()
        .values({
          reactionType: inputStatus as LikesStatuses,
          userAccount: { id: userId },
          comment: { id: commentId },
        })
        .orUpdate(['reactionType'], ['user_id', 'comment_id'])
        .execute();

      // await this.commentReactionCounts
      //   .createQueryBuilder()
      //   .insert()
      //   .values({
      //     comment: { id: commentId },
      //     likes_count: () => `"likes_count"::integer + ${likesCount}`,
      //   dislikes_count: () => `"dislikes_count"::integer + ${dislikesCount}`,
      //   })
      //   .orUpdate([], ['comment_id'])
      //   .execute();

      const updateCounterQuery = `
      INSERT INTO comment_reaction_counts (comment_id, likes_count, dislikes_count)
      VALUES ($1, $2, $3)
      ON CONFLICT (comment_id) DO UPDATE SET
        likes_count = comment_reaction_counts.likes_count + EXCLUDED.likes_count,
        dislikes_count = comment_reaction_counts.dislikes_count + EXCLUDED.dislikes_count
    `;

      await this.dataSource.query(updateCounterQuery, [
        commentId,
        likesCount,
        dislikesCount,
      ]);
    } catch (error) {
      console.error(
        `Database fails during update likeStatus in comment operation ${error}`,
      );
    }
  }

  async getUserReaction(
    userId: string,
    commentId: string,
  ): Promise<LikesStatuses | null> {
    try {
      const result = await this.commentReactions
        .createQueryBuilder('cr')
        .select('reactionType')
        .where('cr.user_id = :userId', { userId })
        .andWhere('cr.comment_id = :commentId', { commentId })
        .getRawOne();

      if (!result) return null;

      return result.reactionType;
    } catch (error) {
      console.error(`Database fails during get user's reaction in feedback",
      ${error}`);
      return null;
    }
  }

  async deleteComment(commentId: string): Promise<boolean> {
    try {
      const result = await this.comments.delete({ id: commentId });

      return result.affected !== 0;
    } catch (error) {
      console.error(`Database fails during delete comment operation ${error}`);
      return false;
    }
  }
}
