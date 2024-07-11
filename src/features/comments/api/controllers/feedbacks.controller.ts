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
import {
  AccessTokenGuard,
  CommentsQueryFilter,
  CommentsViewModel,
  CurrentUserId,
  CurrentUserInfo,
  DeleteCommentCommand,
  FeedbacksQueryRepo,
  InputContentDto,
  LikeStatusInputDto,
  PaginationViewModel,
  SetUserIdGuard,
  UpdateCommentCommand,
  UpdateCommentReactionCommand,
  UserSessionDto,
} from '.';
import { RouterPaths } from '../../../../../test/tools/helpers/routing';


@Controller(RouterPaths.comments)
export class FeedbacksController {
  constructor(
    private feedbacksQueryRepo: FeedbacksQueryRepo,
    private commandBus: CommandBus,
  ) {}

  @Get(':id')
  @UseGuards(SetUserIdGuard)
  @HttpCode(HttpStatus.OK)
  async getComment(
    @Param('id') commentId: string,
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
    @CurrentUserInfo() userInfo: UserSessionDto,
    @Query() query: CommentsQueryFilter,
  ): Promise<PaginationViewModel<CommentsViewModel>> {
    const comment = await this.feedbacksQueryRepo.getCommentsByUserId(
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
    @Param('id') commentId: string,
    @CurrentUserInfo() userInfo: UserSessionDto,
    @Body() body: InputContentDto,
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

    const command = new UpdateCommentCommand(commentId, content);

    await this.commandBus.execute(command);
  }

  @Put(':id/like-status')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AccessTokenGuard)
  async updateLikesStatus(
    @Param('id') commentId: string,
    @CurrentUserInfo() userInfo: UserSessionDto,
    @Body() inputStatusModel: LikeStatusInputDto,
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

    const reactionData = {
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
    @Param('id') commentId: string,
    @CurrentUserInfo() userInfo: UserSessionDto,
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
