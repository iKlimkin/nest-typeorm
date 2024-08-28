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
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RouterPaths } from '../../../../infra/utils/routing';
import { PaginationViewModel } from '../../../../domain/sorting-base-filter';
import { CurrentUserInfo } from '../../../auth/infrastructure/decorators/current-user-info.decorator';
import { AccessTokenGuard } from '../../../auth/infrastructure/guards/accessToken.guard';
import { CommentsQueryFilter } from '../../../comments/api/models/output.comment.models/comment-query.filter';
import { ContentType } from '../../../files/api/models/file-types';
import {
  FileMetaPostViewModelType,
  FilesMetaBlogViewModelType,
} from '../../../files/api/models/file-view.model';
import { FilesQueryRepository } from '../../../files/api/query.repo/files.query.repository';
import { FilesCrudApiService } from '../../../files/application/services/files-crud-api.service';
import { CreationPostDtoByBlogId } from '../../../posts/api/models/input.posts.models/create.post.model';
import { PostsQueryFilter } from '../../../posts/api/models/output.post.models/posts-query.filter';
import { PostViewModelType } from '../../../posts/api/models/post.view.models/post-view-model.type';
import { PostsQueryRepo } from '../../../posts/api/query-repositories/posts.query.repo';
import { CreatePostCommand } from '../../../posts/application/use-cases/commands/create-post.command';
import { UserSessionDto } from '../../../security/api/models/security-input.models/security-session-info.model';
import {
  BlogCrudApiService,
  BlogPostsCrudApiService,
} from '../../../../domain/base-services/base.crud.api.service';
import { UpdateBloggerPostCommand } from '../../application/use-case/commands/blogger-update-post.command';
import { CreateBlogCommand } from '../../application/use-case/commands/create-blog.command';
import { DeleteBlogCommand } from '../../application/use-case/commands/delete-blog.command';
import { DeleteBloggerPostCommand } from '../../application/use-case/commands/delete-blogger-blog.command';
import { UpdateBlogCommand } from '../../application/use-case/commands/update-blog.command';
import { UploadBackgroundWallpaperCommand } from '../../application/use-case/commands/upload-background-wallpaper.command';
import { UploadBlogMainImageCommand } from '../../application/use-case/commands/upload-blog-main-image.command';
import { UploadPostMainImageCommand } from '../../application/use-case/commands/upload-post-main-image.command';
import {
  FileDimensionsValidationPipe,
  FileDimensionType,
} from '../../infrastructure/pipes/file-dimensions-validation.pipe';
import { BlogsQueryFilter } from '../models/input.blog.models/blogs-query.filter';
import { CreateBlogInputDto } from '../models/input.blog.models/create.blog.model';
import { UpdateBlogInputDto } from '../models/input.blog.models/update-blog-models';
import {
  AllCommentsForUserBlogsViewType,
  BlogViewModelType,
} from '../models/output.blog.models/blog.view.model-type';
import { BlogsQueryRepo } from '../query-repositories/blogs.query.repo';

@UseGuards(AccessTokenGuard)
@Controller(RouterPaths.blogger)
export class BloggerController {
  constructor(
    private readonly blogsQueryRepo: BlogsQueryRepo,
    private readonly postsQueryRepo: PostsQueryRepo,
    private blogCrudApiService: BlogCrudApiService<any>,
    private blogPostsCrudApiService: BlogPostsCrudApiService<any>,
    private filesCrudApiService: FilesCrudApiService,
    private readonly filesQueryRepo: FilesQueryRepository,
  ) {}

  @Get()
  async getBlogs(
    @Query() query: BlogsQueryFilter,
    @CurrentUserInfo() userInfo: UserSessionDto,
  ): Promise<PaginationViewModel<BlogViewModelType>> {
    return this.blogsQueryRepo.getBlogsByBlogger(userInfo.userId, query);
  }

  @Get('comments')
  async getAllCommentsForUserBlogs(
    @Query() query: CommentsQueryFilter,
    @CurrentUserInfo() userInfo: UserSessionDto,
  ): Promise<PaginationViewModel<AllCommentsForUserBlogsViewType>> {
    return this.blogsQueryRepo.getAllCommentsForUserBlogs(
      userInfo.userId,
      query,
    );
  }

  @Get(':id/posts')
  async getPosts(
    @CurrentUserInfo() userInfo: UserSessionDto,
    @Param('id') blogId: string,
    @Query() query: PostsQueryFilter,
  ): Promise<PaginationViewModel<PostViewModelType>> {
    const blog = await this.blogsQueryRepo.getBlogWithUserInfo(blogId);

    if (!blog) throw new NotFoundException('blog not found');

    if (userInfo.userId !== blog.user.id)
      throw new ForbiddenException(`User doesn't have permissions`);

    return this.postsQueryRepo.getPostsByBlogId({
      blogId: blog.id,
      queryOptions: query,
      userId: userInfo?.userId,
    });
  }

  @Post(':id/posts')
  @HttpCode(HttpStatus.CREATED)
  async createPost(
    @Param('id') blogId: string,
    @Body() body: CreationPostDtoByBlogId,
    @CurrentUserInfo() userInfo: UserSessionDto,
  ): Promise<PostViewModelType> {
    const command = new CreatePostCommand({
      ...body,
      userId: userInfo.userId,
      blogId,
    });
    return this.blogPostsCrudApiService.create(command);
  }

  @Post(':id/images/wallpaper')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  async uploadBlogBackgroundWallpaper(
    @Param('id') blogId: string,
    @CurrentUserInfo() userInfo: UserSessionDto,
    @UploadedFile(
      // new ParseFilePipe({
      //   validators: [
      //     new FileDimensionsValidationPipe({
      //       imageHeight: 312,
      //       imageWidth: 1028,
      //       fileTypes: ['image/jpeg', 'image/png', 'image/jpg'],
      //     }),
      //   ],
      // }),
      new FileDimensionsValidationPipe({
        imageHeight: 312,
        imageWidth: 1028,
        fileTypes: ['image/jpeg', 'image/png', 'image/jpg'],
      }),
    )
    file: FileDimensionType,
  ): Promise<FilesMetaBlogViewModelType> {
    const { buffer, size, originalname, mimetype, width, height } = file;
    const command = new UploadBackgroundWallpaperCommand({
      userId: userInfo.userId,
      blogId,
      fileBuffer: buffer,
      fileSize: size,
      fileName: originalname,
      fileType: mimetype as ContentType,
      fileWidth: width,
      fileHeight: height,
    });

    await this.filesCrudApiService.create(command);
    return this.filesQueryRepo.getBlogImages(blogId);
  }

  @Post(':id/images/main')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  async uploadBlogMainImage(
    @Param('id') blogId: string,
    @CurrentUserInfo() userInfo: UserSessionDto,
    @UploadedFile(
      new FileDimensionsValidationPipe({
        imageHeight: 156,
        imageWidth: 156,
        fileTypes: ['image/jpeg', 'image/png', 'image/jpg'],
      }),
    )
    file: FileDimensionType,
  ): Promise<FilesMetaBlogViewModelType> {
    const { buffer, size, originalname, mimetype, width, height } = file;
    const command = new UploadBlogMainImageCommand({
      userId: userInfo.userId,
      blogId,
      fileBuffer: buffer,
      fileSize: size,
      fileName: originalname,
      fileType: mimetype as ContentType,
      fileWidth: width,
      fileHeight: height,
    });

    await this.filesCrudApiService.create(command);
    return this.filesQueryRepo.getBlogImages(blogId);
  }

  @Post(':id/posts/:postId/images/main')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  async uploadPostMainImage(
    @Param('id') blogId: string,
    @Param('postId') postId: string,
    @CurrentUserInfo() userInfo: UserSessionDto,
    @UploadedFile(
      new FileDimensionsValidationPipe({
        imageHeight: 432,
        imageWidth: 940,
        fileTypes: ['image/jpeg', 'image/png', 'image/jpg'],
      }),
    )
    file: FileDimensionType,
  ): Promise<FileMetaPostViewModelType> {
    const { buffer, size, originalname, mimetype, width, height } = file;
    const command = new UploadPostMainImageCommand({
      userId: userInfo.userId,
      blogId,
      postId,
      fileBuffer: buffer,
      fileSize: size,
      fileName: originalname,
      fileType: mimetype as ContentType,
      fileWidth: width,
      fileHeight: height,
    });

    await this.filesCrudApiService.create(command);
    return this.filesQueryRepo.getBlogPostImages(postId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createBlog(
    @Body() data: CreateBlogInputDto,
    @CurrentUserInfo() userInfo: UserSessionDto,
  ): Promise<BlogViewModelType> {
    const command = new CreateBlogCommand({
      ...data,
      userId: userInfo.userId,
    });

    return this.blogCrudApiService.create(command);
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateBlog(
    @Param('id') blogId: string,
    @CurrentUserInfo() userInfo: UserSessionDto,
    @Body() data: UpdateBlogInputDto,
  ) {
    const command = new UpdateBlogCommand({
      ...data,
      blogId,
      userId: userInfo.userId,
    });
    return this.blogCrudApiService.updateOrDelete(command);
  }

  @Put(':id/posts/:postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePost(
    @Param('id') blogId: string,
    @Param('postId') postId: string,
    @Body() data: CreationPostDtoByBlogId,
    @CurrentUserInfo() userInfo: UserSessionDto,
  ) {
    const command = new UpdateBloggerPostCommand({
      ...data,
      postId,
      blogId,
      userId: userInfo.userId,
    });
    return this.blogPostsCrudApiService.updateOrDelete(command);
  }

  @Delete(':blogId/posts/:postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(
    @CurrentUserInfo() userInfo: UserSessionDto,
    @Param('blogId') blogId: string,
    @Param('postId') postId: string,
  ) {
    const command = new DeleteBloggerPostCommand({
      blogId,
      postId,
      userId: userInfo.userId,
    });
    return this.blogPostsCrudApiService.updateOrDelete(command);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBlog(
    @Param('id') blogId: string,
    @CurrentUserInfo() userInfo: UserSessionDto,
  ) {
    const command = new DeleteBlogCommand({ blogId, userId: userInfo.userId });
    return this.blogCrudApiService.updateOrDelete(command);
  }
}
