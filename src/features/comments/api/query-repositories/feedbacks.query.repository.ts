import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { likesStatus } from '../../../../domain/likes.types';
import { PaginationViewModel } from '../../../../domain/sorting-base-filter';
import { getLikeStatus } from '../../../../infra/utils/get-like-status';
import { getPagination } from '../../../../infra/utils/get-pagination';
import { getSearchTerm } from '../../../../infra/utils/search-term-finder';
import {
  Comment,
  CommentModelType,
} from '../../domain/entities/comment.schema';
import { CommentsViewModel } from '../models/comments.view.models/comments.view-model.type';
import { getCommentsViewModel } from '../models/comments.view.models/comments.view.model';
import { CommentsQueryFilter } from '../models/output.comment.models/comment-query.filter';

@Injectable()
export class FeedbacksQueryRepository {
  constructor(
    @InjectModel(Comment.name) private CommentModel: CommentModelType,
  ) {}

  async getCommentsByPostId(
    postId: string,
    inputData: CommentsQueryFilter,
    userId?: string,
  ): Promise<PaginationViewModel<CommentsViewModel> | null> {
    try {
      const { searchContentTerm } = inputData;

      const { pageNumber, pageSize, sort, skip } = getPagination(inputData);

      const filter = getSearchTerm({ searchContentTerm });

      const comments = await this.CommentModel.find({
        postId,
        ...filter,
      })
        .sort(sort)
        .skip(skip)
        .limit(pageSize);

      const totalCount = await this.CommentModel.countDocuments({
        postId,
        ...filter,
      });
      const pagesCount = Math.ceil(totalCount / pageSize);

      return {
        pagesCount: pagesCount,
        page: pageNumber,
        pageSize: pageSize,
        totalCount: totalCount,
        items: comments.map((comment) => getCommentsViewModel(comment, userId)),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Database fails during find comments by postId operation',
        error,
      );
    }
  }

  async getCommentById(
    commentId: string,
    userId?: string,
  ): Promise<CommentsViewModel | null> {
    try {
      const foundedComment = await this.CommentModel.findById(
        new ObjectId(commentId),
      );

      if (!foundedComment) return null;

      return getCommentsViewModel(foundedComment, userId);
    } catch (error) {
      throw new InternalServerErrorException(
        'Database fails during find comment by id operation',
        error,
      );
    }
  }

  async getUserLikes(
    userId: string,
    commentId: string,
  ): Promise<likesStatus | null> {
    try {
      const foundedUserReaction = await this.CommentModel.findOne({
        _id: commentId,
        likesUserInfo: {
          $elemMatch: {
            userId,
            status: { $exists: true },
          },
        },
      });

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

  async getCommentsByUserId(
    userId: string,
    inputData: CommentsQueryFilter,
  ): Promise<PaginationViewModel<CommentsViewModel>> {
    try {
      const { pageNumber, pageSize, sort, skip } = getPagination(inputData);

      const searchBy = { 'commentatorInfo.userId': userId };

      const userComments = await this.CommentModel.find(searchBy)
        .sort(sort)
        .skip(skip)
        .limit(pageSize);

      const totalCount = await this.CommentModel.countDocuments(searchBy);
      const pagesCount = Math.ceil(totalCount / pageSize);

      return {
        pagesCount: pagesCount,
        page: pageNumber,
        pageSize: pageSize,
        totalCount: totalCount,
        items: userComments.map((comment) =>
          getCommentsViewModel(comment, userId),
        ),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Database fails during find comment by userId operation',
        error,
      );
    }
  }
}
