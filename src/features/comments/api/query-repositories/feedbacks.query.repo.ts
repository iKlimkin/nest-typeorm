import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { LikesStatuses } from '../../../../domain/reaction.models';
import { PaginationViewModel } from '../../../../domain/sorting-base-filter';
import { getPagination } from '../../../../infra/utils/get-pagination';
import { CommentReaction } from '../../domain/entities/comment-reactions.entity';
import { Comment } from '../../domain/entities/comment.entity';
import { getCommentsRawViewModel } from '../models/comments.view.models/comments.raw-view.model';
import { CommentsViewModel } from '../models/comments.view.models/comments.view-model.type';
import { getCommentsViewModel } from '../models/comments.view.models/comments.view.model';
import { CommentsQueryFilter } from '../models/output.comment.models/comment-query.filter';
import {
  CommentReactionsRawType,
  CommentSqlDbType,
} from '../models/output.comment.models/comment.models';

@Injectable()
export class FeedbacksQueryRepo {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    @InjectRepository(Comment) private readonly comments: Repository<Comment>,
    @InjectRepository(CommentReaction)
    private readonly commentReactions: Repository<CommentReaction>
  ) {}

  async getComments(
    queryOptions: CommentsQueryFilter,
    userId?: string
  ): Promise<PaginationViewModel<CommentsViewModel>> {
    try {
      const { searchContentTerm } = queryOptions;

      const { pageNumber, pageSize, sortBy, skip, sortDirection } =
        getPagination(queryOptions);

      const filter = `%${searchContentTerm ? searchContentTerm : ''}%`;

      const queryBuilder = this.comments.createQueryBuilder('comments');

      queryBuilder
        .where('comments.content ILIKE :filter', { filter })
        .leftJoin('comments.userAccount', 'user')
        .leftJoin('comments.commentReactionCounts', 'reactionCounter')
        .addSelect([
          'user.id',
          'reactionCounter.likes_count',
          'reactionCounter.dislikes_count',
        ])
        .orderBy(
          sortBy === 'created_at'
            ? 'comments.created_at'
            : `comments.${sortBy}`,
          sortDirection
        )
        .skip(skip)
        .take(pageSize);

      const [comments, count] = await queryBuilder.getManyAndCount();

      let myReactions: CommentReaction[];

      if (userId) {
        const reactions = await this.commentReactions.find({
          where: {
            userAccount: {
              id: userId,
            },
          },
          relations: ['comment'],
        });

        myReactions = reactions ? reactions : [];
      }

      const commentsViewModel = new PaginationViewModel<CommentsViewModel>(
        comments.map((comment: Comment) =>
          getCommentsViewModel(comment, myReactions)
        ),
        pageNumber,
        pageSize,
        count
      );

      return commentsViewModel;
    } catch (error) {
      throw new Error(`Database fails operation during find comments ${error}`);
    }
  }
  async getCommentsByPostId(
    postId: string,
    queryOptions: CommentsQueryFilter,
    userId?: string
  ): Promise<PaginationViewModel<CommentsViewModel> | null> {
    try {
      const { searchContentTerm } = queryOptions;

      const { pageNumber, pageSize, sortBy, skip, sortDirection } =
        getPagination(queryOptions);

      const searchTerm = `%${searchContentTerm ? searchContentTerm : ''}%`;

      const queryBuilder = this.comments.createQueryBuilder('comments');

      queryBuilder
        .where('comments.content ILIKE :searchTerm', { searchTerm })
        .andWhere('comments.post_id = :postId', { postId })
        .leftJoin('comments.userAccount', 'user')
        .addSelect('user.id')
        .leftJoinAndSelect('comments.commentReactionCounts', 'counts')
        .orderBy(
          sortBy !== 'created_at'
            ? `comments.${sortBy}`
            : `comments.created_at`,
          sortDirection
        )
        .skip(skip)
        .take(pageSize);

      const result = await queryBuilder.getManyAndCount();

      const comments = result[0];
      const commentsCount = result[1];

      let myReactions: CommentReaction[];

      if (userId) {
        const reactions = await this.commentReactions.find({
          where: {
            userAccount: {
              id: userId,
            },
            comment: {
              post: {
                id: postId,
              },
            },
          },
          relations: ['comment'],
        });

        myReactions = reactions ? reactions : [];
      }

      const commentsViewModel = new PaginationViewModel<CommentsViewModel>(
        comments.map((comment: Comment) =>
          getCommentsViewModel(comment, myReactions)
        ),
        pageNumber,
        pageSize,
        commentsCount
      );

      return commentsViewModel;
    } catch (error) {
      console.error(
        `Database fails during find comments by postId operation ${error}`
      );
      return null;
    }
  }

  async getCommentById(
    commentId: string,
    userId?: string
  ): Promise<CommentsViewModel | null> {
    try {
      let myReaction: LikesStatuses = LikesStatuses.None;

      if (userId) {
        const myStorageReaction = await this.commentReactions.findOne({
          where: {
            comment: {
              id: commentId,
            },
            userAccount: {
              id: userId,
            },
          },
        });

        myReaction = myStorageReaction
          ? myStorageReaction.reaction_type
          : LikesStatuses.None;
      }

      const comment = await this.comments.findOne({
        where: {
          id: commentId,
        },
        relations: ['userAccount', 'commentReactionCounts'],
      });

      if (!comment) return null;

      return getCommentsViewModel(comment, myReaction);
    } catch (error) {
      console.error(
        'Database fails during find comment by id operation',
        error
      );
      return null;
    }
  }

  async getCommentsByUserId(
    userId: string,
    queryOptions: CommentsQueryFilter
  ): Promise<PaginationViewModel<CommentsViewModel>> {
    try {
      const { pageNumber, pageSize, sortBy, skip, sortDirection } =
        getPagination(queryOptions);

      const reactionsResult = await this.dataSource.query(
        `
          SELECT reaction_type, comment_id
            FROM comment_reactions cr
            WHERE user_id = $1
        `,
        [userId]
      );

      const userReactions: CommentReactionsRawType[] = reactionsResult;

      const reactionCounter = await this.dataSource.query(
        `
        SELECT likes_count, dislikes_count, comment_id
        FROM comment_reactions cr
        INNER JOIN comment_reaction_counts USING(comment_id)
        WHERE user_id = $1
        `,
        [userId]
      );

      const [commentsCounter] = await this.dataSource.query(
        `
          SELECT COUNT(id)
          FROM comments
          WHERE user_id = $1
        `,
        [userId]
      );

      const sortQuery = `
          SELECT *
            FROM comments
            WHERE user_id = $1
            ORDER BY ${sortBy} ${sortDirection}
            LIMIT $2 OFFSET $3
        `;

      const result = await this.dataSource.query(sortQuery, [
        userId,
        pageSize,
        skip,
      ]);

      const commentsViewModel = new PaginationViewModel<CommentsViewModel>(
        result.map((comment: CommentSqlDbType) =>
          getCommentsRawViewModel(comment, reactionCounter, userReactions)
        ),
        pageNumber,
        pageSize,
        commentsCounter.count
      );

      return commentsViewModel;
    } catch (error) {
      throw new InternalServerErrorException(
        'Database fails during find comment by userId operation',
        error
      );
    }
  }
}
