import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { PaginationViewModel } from '../../../../domain/sorting-base-filter';
import { CurrentUserId } from '../../../../infra/decorators/current-user-id.decorator';
import { SetUserIdGuard } from '../../../../infra/guards/set-user-id.guard';
import { ObjectIdPipe } from '../../../../infra/pipes/valid-objectId.pipe';
import { UserInfoType } from '../../../auth/api/models/auth-input.models.ts/user-info';
import { CurrentUserInfo } from '../../../auth/infrastructure/decorators/current-user-info.decorator';
import { AccessTokenGuard } from '../../../auth/infrastructure/guards/accessToken.guard';
import { InputLikeStatusModel } from '../../../posts/api/models/input.posts.models/input-post..model';
import { DeleteCommentSqlCommand } from '../../application/use-cases/commands/delete-comment-sql.command';
import { UpdateCommentSqlCommand } from '../../application/use-cases/commands/update-comment-sql.command';
import { UpdateCommentReactionSqlCommand } from '../../application/use-cases/commands/update-user-reaction-sql.command';
import { CommentsViewModel } from '../models/comments.view.models/comments.view-model.type';
import {
  InputContentModel,
  ReactionDataModel,
} from '../models/input.comment.models';
import { CommentsQueryFilter } from '../models/output.comment.models/comment-query.filter';
import { FeedbacksQuerySqlRepo } from '../query-repositories/feedbacks.query.sql-repository';
import { FeedbacksQueryTORRepo } from '../query-repositories/feedbacks.query.typeorm-repository';

@Controller('comments')
export class FeedbacksSqlController {
  constructor(
    private feedbacksQuerySqlRepo: FeedbacksQuerySqlRepo,
    private feedbacksQueryRepo: FeedbacksQueryTORRepo,
    private commandBus: CommandBus,
  ) {}

  @Get(':id')
  @UseGuards(SetUserIdGuard)
  @HttpCode(HttpStatus.OK)
  async getComment(
    @Param('id', ObjectIdPipe) commentId: string,
    @CurrentUserId() userId: string,
  ): Promise<CommentsViewModel> {
    const comment = await this.feedbacksQueryRepo.getCommentById(
      commentId,
      userId,
    );

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return comment;
  }

  @Get()
  @UseGuards(SetUserIdGuard)
  @HttpCode(HttpStatus.OK)
  async getComments(
    @Query() query: CommentsQueryFilter,
    @CurrentUserId() userId: string,
  ): Promise<PaginationViewModel<CommentsViewModel>> {
    return this.feedbacksQueryRepo.getComments(query, userId);
  }

  @Get('user/test')
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.OK)
  async getUserComments(
    @CurrentUserInfo() userInfo: UserInfoType,
    @Query() query: CommentsQueryFilter,
  ): Promise<PaginationViewModel<CommentsViewModel>> {
    const comment = await this.feedbacksQuerySqlRepo.getCommentsByUserId(
      userInfo.userId,
      query,
    );

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return comment;
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AccessTokenGuard)
  async updateComment(
    @Param('id', ObjectIdPipe) commentId: string,
    @CurrentUserInfo() userInfo: UserInfoType,
    @Body() body: InputContentModel,
  ) {
    const { content } = body;

    const foundedComment =
      await this.feedbacksQueryRepo.getCommentById(commentId);

    if (!foundedComment) {
      throw new NotFoundException('Comment not found');
    }

    if (userInfo.userId !== foundedComment.commentatorInfo.userId) {
      throw new ForbiddenException('Do not have permission');
    }

    const command = new UpdateCommentSqlCommand(commentId, content);

    await this.commandBus.execute(command);
  }

  @Put(':id/like-status')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AccessTokenGuard)
  async updateLikesStatus(
    @Param('id', ObjectIdPipe) commentId: string,
    @CurrentUserInfo() userInfo: UserInfoType,
    @Body() inputStatusModel: InputLikeStatusModel,
  ) {
    const { likeStatus } = inputStatusModel;
    const { userId } = userInfo;

    const comment = await this.feedbacksQueryRepo.getCommentById(
      commentId,
      userId,
    );

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.likesInfo.myStatus === likeStatus) return;

    const reactionData: ReactionDataModel = {
      commentId,
      userId,
      inputStatus: likeStatus,
    };

    const command = new UpdateCommentReactionSqlCommand(reactionData);

    await this.commandBus.execute(command);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AccessTokenGuard)
  async deleteComment(
    @Param('id', ObjectIdPipe) commentId: string,
    @CurrentUserInfo() userInfo: UserInfoType,
  ) {
    const comment = await this.feedbacksQueryRepo.getCommentById(commentId);

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (userInfo.userId !== comment.commentatorInfo.userId) {
      throw new ForbiddenException('Do not have permission');
    }
    const command = new DeleteCommentSqlCommand(commentId);

    await this.commandBus.execute(command);
  }
}
