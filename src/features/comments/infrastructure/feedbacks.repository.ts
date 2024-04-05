import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { ReactionCommentDto, likesStatus } from '../../../domain/likes.types';
import { getLikeStatus } from '../../../infra/utils/get-like-status';
import {
  Comment,
  CommentDocument,
  CommentModelType,
} from '../domain/entities/comment.schema';

@Injectable()
export class FeedbacksRepository {
  constructor(
    @InjectModel(Comment.name) private CommentModel: CommentModelType,
  ) {}

  async save(commentSmartModel: CommentDocument): Promise<CommentDocument> {
    try {
      return commentSmartModel.save();
    } catch (error) {
      throw new InternalServerErrorException(
        'Database fails during save comment operation',
        error,
      );
    }
  }

  async updateComment(commentId: string, content: string): Promise<boolean> {
    try {
      const comment = await this.CommentModel.findByIdAndUpdate(commentId, {
        $set: {
          content,
        },
      });

      return !!comment;
    } catch (error) {
      throw new InternalServerErrorException(
        'Database fails during update comment operation',
        error,
      );
    }
  }

  async deleteComment(commentId: string): Promise<boolean> {
    try {
      return this.CommentModel.findByIdAndDelete(commentId).lean();
    } catch (error) {
      throw new InternalServerErrorException(
        'Database fails during delete comment operation',
        error,
      );
    }
  }

  async createLikeStatus(
    inputReactionData: ReactionCommentDto,
  ): Promise<boolean> {
    try {
      const createdLikeStatus = await this.CommentModel.findByIdAndUpdate(
        new ObjectId(inputReactionData.commentId),
        {
          $addToSet: {
            likesUserInfo: {
              userId: inputReactionData.userId,
              status: inputReactionData.inputStatus,
            },
          },
          $inc: {
            'likesCountInfo.likesCount': inputReactionData.likesCount,
            'likesCountInfo.dislikesCount': inputReactionData.dislikesCount,
          },
        },
        { new: true },
      );

      return !!createdLikeStatus;
    } catch (error) {
      throw new InternalServerErrorException(
        'Database fails during make likeStatus in comment operation',
        error,
      );
    }
  }

  async updateLikeStatus(
    inputReactionData: ReactionCommentDto,
  ): Promise<boolean> {
    try {
      const updatedLike = await this.CommentModel.findOneAndUpdate(
        {
          _id: new ObjectId(inputReactionData.commentId),
          likesUserInfo: { $elemMatch: { userId: inputReactionData.userId } },
        },
        {
          $set: {
            'likesUserInfo.$.status': inputReactionData.inputStatus,
          },

          $inc: {
            'likesCountInfo.likesCount': inputReactionData.likesCount,
            'likesCountInfo.dislikesCount': inputReactionData.dislikesCount,
          },
        },
        { new: true },
      );

      return !!updatedLike;
    } catch (error) {
      throw new InternalServerErrorException(
        'Database fails during update likeStatus in comment operation',
        error,
      );
    }
  }

  async getUserReaction(
    userId: string,
    commentId: string,
  ): Promise<likesStatus | null> {
    try {
      const foundedUserReaction = await this.CommentModel.findById(
        new ObjectId(commentId),
        {
          likesUserInfo: {
            $elemMatch: {
              userId,
              status: { $exists: true },
            },
          },
        },
      );

      if (!foundedUserReaction) return null;

      const [status] = getLikeStatus(foundedUserReaction.likesUserInfo, userId);

      return status;
    } catch (error) {
      throw new InternalServerErrorException(
        "Database fails during get user's likes operation in feedback",
        error,
      );
    }
  }
}
