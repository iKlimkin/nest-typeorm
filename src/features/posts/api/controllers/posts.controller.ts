import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  PaginationViewModel,
  CurrentUserId,
  LayerNoticeInterceptor,
  handleErrors,
  UserSessionDto,
  CurrentUserInfo,
  AccessTokenGuard,
  BasicSAAuthGuard,
  InputContentDto,
  CommentsViewModel,
  FeedbacksQueryRepo,
  CreateCommentCommand,
  UpdatePostReactionCommand,
  LikeStatusInputDto,
  PostsQueryFilter,
  PostViewModelType,
  PostsQueryRepo,
  SetUserIdGuard,
  OutputId,
  CreationPostDtoByBlogId,
  UpdatePostCommand,
  DeletePostCommand,
} from './index';
import { RouterPaths } from '../../../../infra/utils/routing';
import { PostCrudApiService } from '../../../../domain/base-services/base.crud.api.service';
import { CommentsQueryFilter } from '../../../comments/api/models/output.comment.models/comment-query.filter';

@Controller(RouterPaths.posts)
export class PostsController {
  constructor(
    private feedbacksQueryRepo: FeedbacksQueryRepo,
    private postsQueryRepo: PostsQueryRepo,
    private commandBus: CommandBus,
    private postCrudApiService: PostCrudApiService<CreateCommentCommand>,
  ) {}

  @Get()
  @UseGuards(SetUserIdGuard)
  @HttpCode(HttpStatus.OK)
  async getPosts(
    @Query() query: PostsQueryFilter,
    @CurrentUserId() userId: string,
  ): Promise<PaginationViewModel<PostViewModelType>> {
    return this.postsQueryRepo.getAllPosts(query, userId);
  }

  @Get(':id')
  @UseGuards(SetUserIdGuard)
  async getById(
    @Param('id') postId: string,
    @CurrentUserId() userId: string,
  ): Promise<PostViewModelType> {
    const post = await this.postsQueryRepo.getById(postId, userId);

    if (!post) {
      throw new NotFoundException('post not found');
    }

    return post;
  }

  @Put(':id/like-status')
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateLikesStatus(
    @Param('id') postId: string,
    @Body() body: LikeStatusInputDto,
    @CurrentUserInfo() userInfo: UserSessionDto,
  ) {
    const { userId } = userInfo;
    const { likeStatus } = body;

    const post = await this.postsQueryRepo.getById(postId, userId);

    if (!post) throw new NotFoundException('Post was not found');

    if (post.extendedLikesInfo.myStatus === likeStatus) return;

    const reactionDto = {
      postId,
      userId,
      inputStatus: likeStatus,
    };

    const command = new UpdatePostReactionCommand(reactionDto);
    await this.commandBus.execute<UpdatePostReactionCommand, void>(command);
  }

  @Get(':id/comments')
  @UseGuards(SetUserIdGuard)
  async getComments(
    @Param('id') postId: string,
    @CurrentUserId() userId: string,
    @Query() query: CommentsQueryFilter,
  ): Promise<PaginationViewModel<CommentsViewModel>> {
    const post = await this.postsQueryRepo.getById(postId);

    if (!post) {
      throw new NotFoundException('Post was not found');
    }

    const comments = await this.feedbacksQueryRepo.getCommentsByPostId(
      postId,
      query,
      userId,
    );

    if (!comments) {
      throw new NotFoundException('Comments were not found');
    }

    return comments;
  }

  @Post(':id/comments')
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.CREATED)
  async createComment(
    @Param('id') postId: string,
    @Body() body: InputContentDto,
    @CurrentUserInfo() userInfo: UserSessionDto,
  ): Promise<CommentsViewModel> {
    const createComment = new CreateCommentCommand({
      content: body.content,
      userId: userInfo.userId,
      postId,
    });
    return this.postCrudApiService.create(createComment);
  }

  @Put(':id')
  @UseGuards(BasicSAAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePost(
    @Param('id') postId: string,
    @Body() data: CreationPostDtoByBlogId,
  ) {
    const post = await this.postsQueryRepo.getById(postId);

    if (!post) throw new NotFoundException();

    const command = new UpdatePostCommand({ ...data, postId });

    await this.commandBus.execute(command);
  }

  @Delete(':id')
  @UseGuards(BasicSAAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(@Param('id') postId: string) {
    const command = new DeletePostCommand(postId);
    const result = await this.commandBus.execute<DeletePostCommand, boolean>(
      command,
    );

    if (!result) {
      throw new NotFoundException('Post not found');
    }
  }
}
