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
  OutputId,
  UpdateReactionModelType,
} from '../../../../domain/likes.types';
import { PaginationViewModel } from '../../../../domain/sorting-base-filter';
import { CurrentUserId } from '../../../../infra/decorators/current-user-id.decorator';
import { SetUserIdGuard } from '../../../../infra/guards/set-user-id.guard';
import { ObjectIdPipe } from '../../../../infra/pipes/valid-objectId.pipe';
import { handleErrors } from '../../../../infra/utils/interlay-error-handler.ts/interlay-errors.handler';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { UsersSqlQueryRepository } from '../../../admin/api/query-repositories/users.query.sql-repo';
import { UserInfoType } from '../../../auth/api/models/auth-input.models.ts/security-user-session-info';
import { CurrentUserInfo } from '../../../auth/infrastructure/decorators/current-user-info.decorator';
import { AccessTokenGuard } from '../../../auth/infrastructure/guards/accessToken.guard';
import { BasicSAAuthGuard } from '../../../auth/infrastructure/guards/basic-auth.guard';
import { CommentsViewModel } from '../../../comments/api/models/comments.view.models/comments.view-model.type';
import { InputContentModel } from '../../../comments/api/models/input.comment.models';
import { FeedbacksQuerySqlRepo } from '../../../comments/api/query-repositories/feedbacks.query.sql-repository';
import { CreateCommentSqlCommand } from '../../../comments/application/use-cases/commands/create-comment-sql.command';
import { CreatePostSqlCommand } from '../../application/use-cases/commands/create-post-sql.command';
import { DeletePostSqlCommand } from '../../application/use-cases/commands/delete-post-sql.command';
import { UpdatePostReactionSqlCommand } from '../../application/use-cases/commands/update-post-reaction-sql.command';
import { UpdatePostSqlCommand } from '../../application/use-cases/commands/update-post.command';
import { InputPostModel } from '../models/input.posts.models/create.post.model';
import { InputLikeStatusModel } from '../models/input.posts.models/input-post..model';
import { PostsQueryFilter } from '../models/output.post.models/posts-query.filter';
import { PostViewModelType } from '../models/post.view.models/post-view-model.type';
import { PostsSqlQueryRepo } from '../query-repositories/posts-query.sql-repo';
import { PostsTORQueryRepo } from '../query-repositories/posts.query.repo';
import { FeedbacksQueryTORRepo } from '../../../comments/api/query-repositories/feedbacks.query.typeorm-repository';
import { UsersQueryRepo } from '../../../admin/infrastructure/users.query.repo';

@Controller('posts')
export class PostsSqlController {
  constructor(
    private feedbacksQuerySqlRepo: FeedbacksQuerySqlRepo,
    private feedbacksQueryRepo: FeedbacksQueryTORRepo,
    private postsSqlQueryRepo: PostsSqlQueryRepo,
    private postsQueryRepo: PostsTORQueryRepo,
    private usersSqlQueryRepository: UsersSqlQueryRepository,
    private usersQueryRepo: UsersQueryRepo,
    private commandBus: CommandBus,
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

  @Get('test')
  @UseGuards(SetUserIdGuard)
  @HttpCode(HttpStatus.OK)
  async getPostsTest(
    @Query() query: PostsQueryFilter,
    @CurrentUserId() userId: string,
  ): Promise<PaginationViewModel<PostViewModelType>> {
    return this.postsQueryRepo.getPostsForTest(query, userId);
  }

  @Get(':id')
  @UseGuards(SetUserIdGuard)
  async getPostById(
    @Param('id', ObjectIdPipe) postId: string,
    @CurrentUserId() userId: string,
  ): Promise<PostViewModelType> {
    const post = await this.postsQueryRepo.getPostById(postId, userId);

    if (!post) {
      throw new NotFoundException('post not found');
    }

    return post;
  }

  @Put(':id/like-status')
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateLikesStatus(
    @Param('id', ObjectIdPipe) postId: string,
    @Body() body: InputLikeStatusModel,
    @CurrentUserInfo() userInfo: UserInfoType,
  ) {
    const { userId } = userInfo;
    const { likeStatus } = body;

    const post = await this.postsQueryRepo.getPostById(postId, userId);

    if (!post) throw new NotFoundException('Post not found');

    if (post.extendedLikesInfo.myStatus === likeStatus) return;

    const reactionDto: UpdateReactionModelType = {
      postId,
      userId,
      inputStatus: likeStatus,
    };

    const command = new UpdatePostReactionSqlCommand(reactionDto);
    await this.commandBus.execute<UpdatePostReactionSqlCommand, void>(command);
  }

  @Get(':id/comments')
  @UseGuards(SetUserIdGuard)
  async getComments(
    @Param('id', ObjectIdPipe) postId: string,
    @CurrentUserId() userId: string,
    @Query() query: PostsQueryFilter,
  ): Promise<PaginationViewModel<CommentsViewModel>> {
    const post = await this.postsQueryRepo.getPostById(postId);

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const comments = await this.feedbacksQueryRepo.getCommentsByPostId(
      postId,
      query,
      userId,
    );

    if (!comments) {
      throw new NotFoundException('Comment not found');
    }

    return comments;
  }

  @Post(':id/comments')
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.CREATED)
  async createComment(
    @Param('id', ObjectIdPipe) postId: string,
    @Body() body: InputContentModel,
    @CurrentUserInfo() userInfo: UserInfoType,
  ): Promise<CommentsViewModel> {
    const { content } = body;
    const { userId } = userInfo;

    const existPost = await this.postsQueryRepo.getPostById(postId);

    if (!existPost) {
      throw new NotFoundException('Post not found');
    }

    const createCommentData = {
      content,
      userId,
      postId,
    };

    const command = new CreateCommentSqlCommand(createCommentData);

    const result = await this.commandBus.execute<
      CreateCommentSqlCommand,
      LayerNoticeInterceptor<OutputId>
    >(command);

    if (result.hasError()) {
      const errors = handleErrors(result.code, result.extensions);
      throw errors.error;
    }

    const foundNewComment = await this.feedbacksQueryRepo.getCommentById(
      result.data!.id,
      userId,
    );

    return foundNewComment!;
  }

  // @Post()
  // @UseGuards(BasicSAAuthGuard)
  // @HttpCode(HttpStatus.CREATED)
  // async createPost(
  //   @Body() inputPostModel: InputPostModel,
  // ): Promise<PostViewModelType> {
  //   const command = new CreatePostSqlCommand(inputPostModel);

  //   const result = await this.commandBus.execute<
  //     CreatePostSqlCommand,
  //     LayerNoticeInterceptor<OutputId | null>
  //   >(command);

  //   if (result.hasError()) {
  //     const errors = handleErrors(result.code, result.extensions);
  //     throw errors.error;
  //   }

  //   const post = await this.postsSqlQueryRepo.getPostById(result.data!.id);

  //   if (!post) {
  //     throw new Error();
  //   }

  //   return post;
  // }

  @Put(':id')
  @UseGuards(BasicSAAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePost(
    @Param('id') postId: string,
    @Body() inputPostModel: InputPostModel,
  ) {
    const post = await this.postsQueryRepo.getPostById(postId);

    if (!post) throw new NotFoundException();

    const command = new UpdatePostSqlCommand({ ...inputPostModel, postId });

    await this.commandBus.execute(command);
  }

  @Delete(':id')
  @UseGuards(BasicSAAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(@Param('id') postId: string) {
    const command = new DeletePostSqlCommand(postId);
    const result = await this.commandBus.execute<DeletePostSqlCommand, boolean>(
      command,
    );

    if (!result) {
      throw new NotFoundException('Post not found');
    }
  }
}
