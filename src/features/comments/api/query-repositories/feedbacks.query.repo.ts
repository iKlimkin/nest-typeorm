import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, Repository } from 'typeorm';
import { LikesStatuses } from '../../../../domain/reaction.models';
import { PaginationViewModel } from '../../../../domain/sorting-base-filter';
import { getPagination } from '../../../../infra/utils/get-pagination';
import { CommentReaction } from '../../domain/entities/comment-reactions.entity';
import { Comment } from '../../domain/entities/comment.entity';
import { getCommentsRawViewModel } from '../models/comments.view.models/comments.raw-view.model';
import { CommentsViewModel } from '../models/comments.view.models/comments.view-model.type';
import {
  getCommentsViewModel,
  parseCommentToView,
} from '../models/comments.view.models/comments.view.model';
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
    private readonly commentReactions: Repository<CommentReaction>,
  ) {}

  async getComments(
    queryOptions: CommentsQueryFilter,
    userId?: string,
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
          sortDirection,
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
          getCommentsViewModel(comment, myReactions),
        ),
        pageNumber,
        pageSize,
        count,
      );

      return commentsViewModel;
    } catch (error) {
      throw new Error(`Database fails operation during find comments ${error}`);
    }
  }
  async getCommentsByPostId(
    postId: string,
    queryOptions: CommentsQueryFilter,
    userId?: string,
  ): Promise<PaginationViewModel<CommentsViewModel> | null> {
    try {
      const { pageNumber, pageSize, sortBy, skip, sortDirection } =
        getPagination(queryOptions);

      const searchTerm = `%${queryOptions.searchContentTerm || ''}%`;

      const queryBuilder = this.comments.createQueryBuilder('comment');

      queryBuilder
        .where('comment.content ILIKE :searchTerm', { searchTerm })
        .andWhere('comment.post_id = :postId', { postId })
        .leftJoin('comment.user', 'user')
        .addSelect('user.id')
        .leftJoin('user.userBan', 'bans')
        .andWhere('bans IS NULL OR bans.isBanned = false')
        .orderBy(
          sortBy !== 'created_at' ? `comment.${sortBy}` : `comment.created_at`,
          sortDirection,
        )
        .skip(skip)
        .take(pageSize);

      if (userId) {
        queryBuilder
          .leftJoin(
            'comment.commentReactions',
            'commentReact',
            'commentReact.userAccountId = :userId',
            { userId },
          )
          .addSelect('commentReact.reactionType');
      }

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
            LEFT JOIN user_account u ON cr."userAccountId" = u.id
            LEFT JOIN user_bans bans ON u.id = bans."userId"
            WHERE cr."commentId" = $1 AND (bans."isBanned" IS NULL OR bans."isBanned" = false)
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

      return new PaginationViewModel<CommentsViewModel>(
        commentsResult.map(parseCommentToView),
        pageNumber,
        pageSize,
        commentsCount,
      );
    } catch (error) {
      console.error(
        `Database fails during find comments by postId operation ${error}`,
      );
      return null;
    }
  }

  async getById(
    commentId: string,
    userId?: string,
  ): Promise<CommentsViewModel | null> {
    const queryBuilder = this.comments.createQueryBuilder('comment');

    queryBuilder
      .leftJoin('comment.user', 'user')
      .addSelect('user.id')
      .leftJoin('user.userBan', 'bans')
      .where('comment.id = :commentId', { commentId })
      .andWhere(
        new Brackets((qb) => {
          qb.where('bans IS NULL').orWhere('bans.isBanned = false');
        }),
      );

    let myReaction = LikesStatuses.None;
    if (userId) {
      const myReactionStatus = await this.commentReactions
        .createQueryBuilder('reaction')
        .select('reaction.reactionType')
        .leftJoin('reaction.userAccount', 'user')
        .leftJoin('user.userBan', 'bans')
        .where('reaction.commentId = :commentId', { commentId })
        .andWhere('user.id = :userId', { userId })
        .andWhere('bans IS NULL OR bans.isBanned = false')
        .getOne();

      myReaction = myReactionStatus?.reactionType
        ? myReactionStatus?.reactionType
        : LikesStatuses.None;
    }

    const reactionsQuery = `
      SELECT 
        COUNT (
          CASE
            WHEN cr."reactionType" = 'Like'
            THEN 1
            ELSE NULL
          END
        ) AS "likesCount",
        COUNT (
          CASE
            WHEN cr."reactionType" = 'Dislike'
            THEN 1
            ELSE NULL
          END
        ) AS "dislikesCount"
      FROM comment_reaction cr
      LEFT JOIN user_account u ON cr."userAccountId" = u.id
      LEFT JOIN user_bans bans ON u.id = bans."userId"
      WHERE cr."commentId" = $1 AND (bans."isBanned" IS NULL OR bans."isBanned" = false)
    `;

    try {
      const comment = await queryBuilder.getOne();
      comment.commentReactions = [
        { reactionType: myReaction } as CommentReaction,
      ];

      const [{ likesCount, dislikesCount }] = await this.dataSource.query(
        reactionsQuery,
        [commentId],
      );

      if (!comment) return null;

      const resultComment = {
        ...comment,
        commentReactionCounts: {
          likes_count: parseInt(likesCount, 10),
          dislikes_count: parseInt(dislikesCount, 10),
        },
      } as Comment;

      return parseCommentToView(resultComment);
    } catch (error) {
      console.error(
        'Database fails during find comment by id operation',
        error,
      );
      return null;
    }
  }

  async getCommentsByUserId(
    userId: string,
    queryOptions: CommentsQueryFilter,
  ): Promise<PaginationViewModel<CommentsViewModel>> {
    try {
      const { pageNumber, pageSize, sortBy, skip, sortDirection } =
        getPagination(queryOptions);

      const reactionsResult = await this.dataSource.query(
        `
          SELECT reactionType, comment_id
            FROM comment_reactions cr
            WHERE user_id = $1
        `,
        [userId],
      );

      const userReactions: CommentReactionsRawType[] = reactionsResult;

      const reactionCounter = await this.dataSource.query(
        `
        SELECT likes_count, dislikes_count, comment_id
        FROM comment_reactions cr
        INNER JOIN comment_reaction_counts USING(comment_id)
        WHERE user_id = $1
        `,
        [userId],
      );

      const [commentsCounter] = await this.dataSource.query(
        `
          SELECT COUNT(id)
          FROM comments
          WHERE user_id = $1
        `,
        [userId],
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
          getCommentsRawViewModel(comment, reactionCounter, userReactions),
        ),
        pageNumber,
        pageSize,
        commentsCounter.count,
      );

      return commentsViewModel;
    } catch (error) {
      throw new InternalServerErrorException(
        'Database fails during find comment by userId operation',
        error,
      );
    }
  }
}
