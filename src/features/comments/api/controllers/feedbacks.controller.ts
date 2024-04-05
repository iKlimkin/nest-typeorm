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
import { CurrentUserId } from '../../../../infra/decorators/current-user-id.decorator';
import { SetUserIdGuard } from '../../../../infra/guards/set-user-id.guard';
import { CommentsViewModel } from '../models/comments.view.models/comments.view-model.type';
import { CommandBus } from '@nestjs/cqrs';
import { UserInfoType } from '../../../auth/api/models/auth-input.models.ts/user-info';
import { CurrentUserInfo } from '../../../auth/infrastructure/decorators/current-user-info.decorator';
import { AccessTokenGuard } from '../../../auth/infrastructure/guards/accessToken.guard';
import { InputLikeStatusModel } from '../../../posts/api/models/input.posts.models/input-post..model';
import { DeleteCommentCommand } from '../../application/use-cases/commands/delete-comment.command';
import { UpdateCommentCommand } from '../../application/use-cases/commands/update-comment.command';
import { UpdateCommentReactionCommand } from '../../application/use-cases/commands/update-user-reaction.command';
import {
  InputContentModel,
  ReactionDataModel,
} from '../models/input.comment.models';
import { FeedbacksQueryRepository } from '../query-repositories/feedbacks.query.repository';
import { ObjectIdPipe } from '../../../../infra/pipes/valid-objectId.pipe';
import { PaginationViewModel } from '../../../../domain/sorting-base-filter';
import { CommentsQueryFilter } from '../models/output.comment.models/comment-query.filter';

@Controller('comments')
export class FeedbacksController {
  constructor(
    private feedbacksQueryRepo: FeedbacksQueryRepository,
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

  @Get('user/:id')
  @HttpCode(HttpStatus.OK)
  async getUserComments(
    @Param('id', ObjectIdPipe) userId: string,
    @Query() query: CommentsQueryFilter,
  ): Promise<PaginationViewModel<CommentsViewModel>> {
    const comment = await this.feedbacksQueryRepo.getCommentsByUserId(
      userId,
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

    const foundedCommentById =
      await this.feedbacksQueryRepo.getCommentById(commentId);

    if (!foundedCommentById) {
      throw new NotFoundException('Comment not found');
    }

    if (userInfo.userId !== foundedCommentById.commentatorInfo.userId) {
      throw new ForbiddenException('Do not have permission');
    }

    const command = new UpdateCommentCommand(commentId, content);

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

    const foundComment = await this.feedbacksQueryRepo.getCommentById(
      commentId,
      userId,
    );

    if (!foundComment) {
      throw new NotFoundException('Comment not found');
    }

    const { myStatus } = foundComment.likesInfo;

    if (myStatus === likeStatus) return;

    const reactionData: ReactionDataModel = {
      commentId,
      userId,
      inputStatus: likeStatus,
    };

    const command = new UpdateCommentReactionCommand(reactionData);

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
    const command = new DeleteCommentCommand(commentId);

    await this.commandBus.execute(command);
  }
}
