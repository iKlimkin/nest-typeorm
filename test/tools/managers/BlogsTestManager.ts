import { HttpServer, HttpStatus, INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import {
  PaginationViewModel,
  SortDirections,
} from '../../../src/domain/sorting-base-filter';
import { InputBlogBannedStatus } from '../../../src/features/blogs/api/models/input.blog.models/blog-banned-status.dto';
import { BlogsQueryFilter } from '../../../src/features/blogs/api/models/input.blog.models/blogs-query.filter';
import { CreateBlogInputDto } from '../../../src/features/blogs/api/models/input.blog.models/create.blog.model';
import { UpdateBlogInputDto } from '../../../src/features/blogs/api/models/input.blog.models/update-blog-models';
import {
  BlogType,
  BlogsTypeWithId,
} from '../../../src/features/blogs/api/models/output.blog.models/blog.models';
import {
  AllCommentsForUserBlogsViewType,
  BlogViewModelType,
  BlogViewModelTypeWithImages,
  SABlogsViewType,
} from '../../../src/features/blogs/api/models/output.blog.models/blog.view.model-type';
import { Blog } from '../../../src/features/blogs/domain/entities/blog.entity';
import {
  FileMetaPostViewModelType,
  FilesMetaBlogViewModelType,
} from '../../../src/features/files/api/models/file-view.model';
import { CreationPostDtoByBlogId } from '../../../src/features/posts/api/models/input.posts.models/create.post.model';
import { PostViewModelType } from '../../../src/features/posts/api/models/post.view.models/post-view-model.type';
import { Post } from '../../../src/features/posts/domain/entities/post.entity';
import { ErrorsMessages } from '../../../src/infra/utils/error-handler';
import { RouterPaths } from '../helpers/routing';
import {
  blogsData,
  createdBlogStructureConsistency,
  createdPostStructureConsistency,
  paginationStructureConsistency,
  validateImageMetaStructureConsistency,
} from '../helpers/structure-validation.helpers';
import { SuperTestBody } from '../models/body.response.model';
import { ApiRouting } from '../routes/api.routing';
import { BlogsRouting } from '../routes/blogs.routing';
import { BaseTestManager } from './BaseTestManager';

import { readFileSync } from 'fs';
import { resolve } from 'path';
import * as sharp from 'sharp';

interface UploadBackWallForBlogParams {
  accessToken: string;
  blogId: string;
  fileBuffer: Buffer;
  fileName?: string;
  expectedStatus?: number;
  contentType?: string;
}

export type SortedByFieldType<T> = {
  entities: T[];
  field: keyof T;
  sortDirection: SortDirections;
};

export class BlogTestManager extends BaseTestManager {
  protected readonly application: INestApplication<HttpServer>;
  protected readonly blogRoutes: ApiRouting;
  protected readonly blogRepository: Repository<Blog>;
  protected readonly postRepository: Repository<Post>;
  protected saBlogsManager: SABlogsTestManager;
  protected bloggerManager: BloggerBlogsTestManager;
  protected publicBlogsManager: PublicBlogsTestManager;
  constructor(protected readonly app: INestApplication) {
    super(new ApiRouting(), app);
    this.blogRepository = this.app.get<Repository<Blog>>(
      getRepositoryToken(Blog),
    );
    this.postRepository = this.app.get<Repository<Post>>(
      getRepositoryToken(Post),
    );
    this.blogRoutes = new ApiRouting();
  }

  createTestManager(
    route: string,
  ): SABlogsTestManager | BloggerBlogsTestManager | PublicBlogsTestManager {
    switch (route) {
      case RouterPaths.SABlogs:
        return new SABlogsTestManager(this.app, this.blogRoutes.SABlogs);
      case RouterPaths.blogger:
        return new BloggerBlogsTestManager(
          this.app,
          this.blogRoutes.bloggerBlogs,
        );
      case RouterPaths.blogs:
        return new PublicBlogsTestManager(this.app, this.blogRoutes.blogs);
      default:
        throw new Error(
          `Route '${route}' doesn't match any known blogs routing`,
        );
    }
  }

  createInputData(field?: any): CreateBlogInputDto {
    if (!field) {
      return {
        name: '',
        description: '',
        websiteUrl: '',
      };
    } else {
      return {
        name: field.name || 'Marcus Aurelius',
        description: field.description || 'Stoic philosopher',
        websiteUrl:
          field.websiteUrl || 'https://en.wikipedia.org/wiki/Stoicism',
      };
    }
  }

  createPostInputData(field?: any): CreationPostDtoByBlogId {
    if (!field) {
      return {
        title: '',
        content: '',
        shortDescription: '',
      };
    } else {
      return {
        title: field.title || 'About stoic quotes',
        content: field.content || 'content about greek philosophers',
        shortDescription: field.shortDescription || 'Stoic philosophers',
      };
    }
  }
}

export class PublicBlogsTestManager extends BlogTestManager {
  constructor(
    protected readonly app: INestApplication,
    protected readonly routing: BlogsRouting,
  ) {
    super(app);
  }

  async getBlogsWithPagination(token: string, query?) {
    if (query) {
      const { pageNumber, pageSize, searchNameTerm, sortBy, sortDirection } =
        query;

      const response = await request(this.application)
        .get(this.routing.getBlogs())
        .auth(token, this.constants.authBearer)
        .query({
          pageSize: pageSize ? pageSize : '',
          pageNumber: pageNumber ? pageNumber : '',
          searchNameTerm: searchNameTerm ? searchNameTerm : '',
          sortDirection: sortDirection ? sortDirection : '',
          sortBy: sortBy ? sortBy : '',
        })
        .expect(HttpStatus.OK);

      return response.body;
    }
  }

  async createBlog(
    inputData: CreateBlogInputDto,
    accessToken: string,
    expectedStatus = HttpStatus.CREATED,
  ): Promise<BlogsTypeWithId> {
    const { body } = await request(this.application)
      .post(this.routing.createBlog())
      .auth(accessToken, this.constants.authBearer)
      .send(inputData)
      .expect(expectedStatus);

    return body;
  }

  async createPost(
    inputData: CreationPostDtoByBlogId,
    accessToken: string,
    blogId: string,
    expectedStatus = HttpStatus.CREATED,
  ): Promise<PostViewModelType> {
    const response = await request(this.application)
      .post(this.routing.createPost(blogId))
      .auth(accessToken, this.constants.authBearer)
      .send(inputData)
      .expect(expectedStatus);

    const post = response.body;

    if (response.status === HttpStatus.CREATED) {
      expect(post).toEqual(createdPostStructureConsistency(inputData, blogId));

      return post;
    }

    return post;
  }

  async createPosts(
    accessToken: string,
    blogId: string,
    numberOfPosts = 2,
  ): Promise<PostViewModelType[]> {
    let posts: PostViewModelType[] = [];

    for (let i = 0; i < numberOfPosts; i++) {
      const postData = {
        title: `title${i}`,
        content: `content${i}`,
        shortDescription: `shortDescription${i}`,
      };

      const post = await this.createPost(
        this.createPostInputData(postData),
        accessToken,
        blogId,
      );

      posts.push(post);
    }

    return posts;
  }

  private getBlogBefore = async (blogId) => {
    try {
      return await this.getBlogByIdDirectly(blogId);
    } catch {
      return null;
    }
  };

  private getPostBefore = async (postId) => {
    try {
      return await this.getPostByIdDirectly(postId);
    } catch {
      return null;
    }
  };

  async updateBlog(
    inputData: UpdateBlogInputDto,
    blogId: string,
    accessToken: string,
    validationFields?: { errorsMessages: ErrorsMessages[] },
    expectStatus: number = HttpStatus.NO_CONTENT,
  ) {
    const blogBefore = await this.getBlogBefore(blogId);
    await request(this.application)
      .put(this.routing.updateBlog(blogId))
      .auth(accessToken, this.constants.authBearer)
      .send(inputData)
      .expect(expectStatus)
      .expect(async ({ body }: SuperTestBody) => {
        if (validationFields) {
          expect(body).toEqual(validationFields);
        } else if (expectStatus === HttpStatus.NO_CONTENT) {
          const blogAfter = await this.getBlogByIdDirectly(blogId);
          expect(blogAfter).not.toEqual(blogBefore);
        }
      });
  }

  async updatePost(
    inputData: CreationPostDtoByBlogId,
    blogId: string,
    postId: string,
    accessToken: string,
    validationFields?: { errorsMessages: ErrorsMessages[] },
    expectStatus: number = HttpStatus.NO_CONTENT,
  ) {
    const postBefore = await this.getPostBefore(postId);
    await request(this.application)
      .put(this.routing.updatePost(blogId, postId))
      .auth(accessToken, this.constants.authBearer)
      .send(inputData)
      .expect(expectStatus)
      .expect(async ({ body }: SuperTestBody) => {
        if (validationFields) {
          expect(body).toEqual(validationFields);
        } else if (expectStatus === HttpStatus.NO_CONTENT) {
          const postAfter = await this.getPostByIdDirectly(postId);
          expect(postBefore).not.toEqual(postAfter);
        }
      });
  }

  private getBlogByIdDirectly = async (blogId: string) =>
    await this.blogRepository.findOneBy({ id: blogId });
  private getPostByIdDirectly = async (postId: string) =>
    await this.postRepository.findOneBy({ id: postId });

  getPublicBlog = async (blogId: string, expectStatus = HttpStatus.OK) => {
    const { body: blog } = await request(this.application)
      .get(this.routing.getBlog(blogId))
      .expect(expectStatus)
      .expect(({ body }: SuperTestBody<BlogViewModelTypeWithImages>) => {
        const isSuccess = !body.errors;
        if (isSuccess) {
          expect(body).toEqual(createdBlogStructureConsistency());
          if (body.images && body.images.main.length) {
            expect(body.images).toEqual(
              validateImageMetaStructureConsistency(),
            );
          }
        }
      });
    return blog;
  };

  async getPublicBlogs(expectedStatus = HttpStatus.OK) {
    let blogs: PaginationViewModel<BlogViewModelType>;
    await request(this.application)
      .get(this.routing.getBlogs())
      .expect(expectedStatus)
      .expect(
        ({ body }: SuperTestBody<PaginationViewModel<BlogViewModelType>>) => {
          blogs = body;
        },
      );

    return blogs;
  }

  async getPublicPostsByBlogId(
    blogId: string,
    expectStatus = HttpStatus.OK,
  ): Promise<PostViewModelType[]> {
    const {
      body: { items: postModels },
    } = await request(this.application)
      .get(this.routing.getPosts(blogId))
      .expect(expectStatus);

    return postModels;
  }

  async deleteBlog(
    blogId: string,
    accessToken: string,
    expectStatus = HttpStatus.NO_CONTENT,
  ) {
    if (expectStatus !== HttpStatus.NO_CONTENT) {
      return request(this.application)
        .delete(this.routing.deleteBlog(blogId))
        .auth(accessToken, this.constants.authBearer)
        .expect(expectStatus);
    }

    let blogBeforeDelete = await this.getBlogByIdDirectly(blogId);

    expect(blogBeforeDelete).toBeDefined();

    await request(this.application)
      .delete(this.routing.deleteBlog(blogId))
      .auth(accessToken, this.constants.authBearer)
      .expect(HttpStatus.NO_CONTENT);

    let blogAfterDelete = await this.getBlogByIdDirectly(blogId);

    expect(blogAfterDelete).toBeNull();
  }

  async createBlogsForFurtherTests(accessTokens: string[], blogsQuantity = 2) {
    const createdBlogs = [];
    const doPush = Array.prototype.push.bind(createdBlogs);
    for (let i = 0; i < blogsQuantity; i++) {
      const tokenIdx = i % accessTokens.length;
      const blog = await this.createBlog(
        this.createInputData({
          name: blogsData.philosophers[i],
          description: blogsData.description[i + 1],
          websiteUrl: blogsData.websiteUrl[i + 1],
        }),
        accessTokens[tokenIdx],
      );
      doPush(blog);
    }
    return createdBlogs;
  }
}

export class SABlogsTestManager extends BlogTestManager {
  constructor(
    protected readonly app: INestApplication,
    protected readonly routing: BlogsRouting,
  ) {
    super(app);
  }
  async getSABlogs(
    query?: any,
    basicOptions = true,
    expectedStatus = HttpStatus.OK,
  ): Promise<PaginationViewModel<SABlogsViewType>> {
    let blogs;

    await request(this.application)
      .get(this.routing.getBlogs())
      .query(query)
      .auth(
        basicOptions ? this.constants.basicUser : '',
        this.constants.basicPass,
        this.constants.authBasic,
      )
      .expect(expectedStatus)
      .expect(
        ({ body }: SuperTestBody<PaginationViewModel<SABlogsViewType>>) => {
          blogs = body;
        },
      );

    return blogs;
  }

  async bindBlog(
    blogId: string,
    userId: string,
    expectStatus = HttpStatus.NO_CONTENT,
  ) {
    const blogBefore = await this.blogRepository.findOne({
      where: { id: blogId },
      relations: ['user'],
    });
    await request(this.application)
      .put(this.routing.bindBlog(blogId, userId))
      .auth(
        this.constants.basicUser,
        this.constants.basicPass,
        this.constants.authBasic,
      )
      .expect(expectStatus)
      .expect(async ({ body }: SuperTestBody) => {
        if (expectStatus === HttpStatus.NO_CONTENT) {
          const blogAfter = await this.blogRepository.findOne({
            where: { id: blogId },
            relations: ['user'],
          });

          expect(blogBefore.user).toBeNull();
          expect(blogAfter.user).toBeDefined();
        }
      });
  }

  async banUnbanBlog(
    blogId: string,
    bannedStatus: InputBlogBannedStatus,
    expectStatus = HttpStatus.NO_CONTENT,
  ) {
    await request(this.application)
      .put(this.routing.banUnban(blogId))
      .auth(
        this.constants.basicUser,
        this.constants.basicPass,
        this.constants.authBasic,
      )
      .send(bannedStatus)
      .expect(expectStatus)
      .expect(async ({ body }: SuperTestBody) => {
        if (expectStatus === HttpStatus.NO_CONTENT) {
          const blogAfter = await this.blogRepository.findOneBy({ id: blogId });
          expect(blogAfter.isBanned).toEqual(bannedStatus.isBanned);
        }
      });
  }
}

export class BloggerBlogsTestManager extends BlogTestManager {
  constructor(
    protected readonly app: INestApplication,
    protected readonly routing: BlogsRouting,
  ) {
    super(app);
  }

  async getAllCommentsForUserBlogs(
    accessToken: string,
    query?: Partial<BlogsQueryFilter>,
    expectStatus = HttpStatus.OK,
  ) {
    let commentsForCurrentUserBlogs: PaginationViewModel<AllCommentsForUserBlogsViewType> =
      null;
    await request(this.application)
      .get(this.routing.getAllCommentsForUserBlogs())
      .auth(accessToken, this.constants.authBearer)
      .query(query)
      .expect(expectStatus)
      .expect(
        ({
          body,
        }: SuperTestBody<
          PaginationViewModel<AllCommentsForUserBlogsViewType>
        >) => {
          commentsForCurrentUserBlogs = body;
        },
      );
    return commentsForCurrentUserBlogs;
  }
  async getBlogsWithPagination(
    token: string,
    query?: Partial<BlogsQueryFilter>,
  ) {
    if (query) {
      const { pageNumber, pageSize, searchNameTerm, sortBy, sortDirection } =
        query;

      const response = await request(this.application)
        .get(this.routing.getBlogs())
        .auth(token, this.constants.authBearer)
        .query({
          pageSize: pageSize ? pageSize : '',
          pageNumber: pageNumber ? pageNumber : '',
          searchNameTerm: searchNameTerm ? searchNameTerm : '',
          sortDirection: sortDirection ? sortDirection : '',
          sortBy: sortBy ? sortBy : '',
        })
        .expect(HttpStatus.OK);

      return response.body;
    }
  }

  async uploadBackWallForBlog(
    uploadBackWallData: UploadBackWallForBlogParams,
  ): Promise<FilesMetaBlogViewModelType> {
    const { accessToken, blogId, fileBuffer } = uploadBackWallData;
    const filename = uploadBackWallData.fileName || 'backWall';
    const expectedStatus =
      uploadBackWallData.expectedStatus || HttpStatus.CREATED;
    const contentType = uploadBackWallData.contentType || 'image/png';
    let fileMetaResponse: FilesMetaBlogViewModelType;
    await request(this.application)
      .post(this.routing.uploadBlogBackgroundWallpaper(blogId))
      .auth(accessToken, this.constants.authBearer)
      .attach('file', fileBuffer, { filename, contentType })
      .expect(expectedStatus)
      .expect(({ body }: SuperTestBody<FilesMetaBlogViewModelType>) => {
        const { fileSize, height, url, width } = body.wallpaper;
        expect(fileSize && height && url && width).toBeDefined();
        fileMetaResponse = body;
      });

    return fileMetaResponse;
  }

  async uploadBlogMainImage(
    uploadBackWallData: UploadBackWallForBlogParams,
  ): Promise<FilesMetaBlogViewModelType> {
    const { accessToken, blogId, fileBuffer } = uploadBackWallData;
    const filename = uploadBackWallData.fileName || 'blogMain';
    const contentType = uploadBackWallData.contentType || 'image/png';
    const expectedStatus =
      uploadBackWallData.expectedStatus || HttpStatus.CREATED;

    let fileMetaResponse: FilesMetaBlogViewModelType;
    await request(this.application)
      .post(this.routing.uploadBlogMainImage(blogId))
      .auth(accessToken, this.constants.authBearer)
      .attach('file', fileBuffer, { filename, contentType })
      .expect(expectedStatus)
      .expect(({ body }: SuperTestBody<FilesMetaBlogViewModelType>) => {
        const { fileSize, height, url, width } = body.wallpaper;
        expect(fileSize && height && url && width).toBeDefined();
        fileMetaResponse = body;
      });

    return fileMetaResponse;
  }

  async uploadPostMainImage(
    uploadBackWallData: UploadBackWallForBlogParams & { postId: string },
  ): Promise<FileMetaPostViewModelType> {
    const { accessToken, blogId, fileBuffer, postId } = uploadBackWallData;
    const contentType = uploadBackWallData.contentType || 'image/png';
    const filename = uploadBackWallData.fileName || 'postMain';
    const expectedStatus =
      uploadBackWallData.expectedStatus || HttpStatus.CREATED;

    let fileMetaResponse: FileMetaPostViewModelType;
    await request(this.application)
      .post(this.routing.uploadPostMainImage(blogId, postId))
      .auth(accessToken, this.constants.authBearer)
      .attach('file', fileBuffer, { filename, contentType })
      .expect(expectedStatus)
      .expect(({ body }: SuperTestBody<FileMetaPostViewModelType>) => {
        body?.main?.length &&
          body.main.forEach((fileParam) => {
            const { fileSize, height, url, width } = fileParam;
            expect(fileSize && height && url && width).toBeDefined();
          });
        fileMetaResponse = body;
      });

    return fileMetaResponse;
  }

  resizeImg = async (
    buffer: Buffer,
    width: number,
    height: number,
  ): Promise<Buffer> => await sharp(buffer).resize(width, height).toBuffer();

  async prepareFileToSend(fileName: string, fileParams: FileDimensions) {
    try {
      const isNameIncludeExtension = fileExtensions.some((e) =>
        fileName.endsWith(e),
      );

      const filePath = resolve(
        __dirname,
        `../../../images/${
          isNameIncludeExtension ? fileName : fileName + '.png'
        }`,
      );
      const fileBuffer = readFileSync(filePath);

      return this.resizeImg(fileBuffer, fileParams.width, fileParams.height);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async createBlog(
    inputData: CreateBlogInputDto,
    accessToken: string,
    expectedStatus = HttpStatus.CREATED,
  ): Promise<BlogsTypeWithId> {
    const { body } = await request(this.application)
      .post(this.routing.createBlog())
      .auth(accessToken, this.constants.authBearer)
      .send(inputData)
      .expect(expectedStatus);

    return body;
  }

  async createPost(
    inputData: CreationPostDtoByBlogId,
    accessToken: string,
    blogId: string,
    expectedStatus: number = HttpStatus.CREATED,
  ): Promise<PostViewModelType> {
    const response = await request(this.application)
      .post(this.routing.createPost(blogId))
      .auth(accessToken, this.constants.authBearer)
      .send(inputData)
      .expect(expectedStatus);

    const post = response.body as PostViewModelType;

    if (response.status === HttpStatus.CREATED) {
      expect(post).toEqual(createdPostStructureConsistency(inputData, blogId));

      return post;
    }

    return post;
  }

  async createPosts(
    accessToken: string,
    blogId: string,
    numberOfPosts = 2,
  ): Promise<PostViewModelType[]> {
    let posts: PostViewModelType[] = [];

    for (let i = 0; i < numberOfPosts; i++) {
      const postData = {
        title: `title${i}`,
        content: `content${i}`,
        shortDescription: `shortDescription${i}`,
      };

      const post = await this.createPost(
        this.createPostInputData(postData),
        accessToken,
        blogId,
      );

      posts.push(post);
    }

    return posts;
  }

  private getBlogBefore = async (blogId) => {
    try {
      return await this.getBlogByIdDirectly(blogId);
    } catch {
      return null;
    }
  };

  private getPostBefore = async (postId) => {
    try {
      return await this.getPostByIdDirectly(postId);
    } catch {
      return null;
    }
  };

  async updateBlog(
    inputData: UpdateBlogInputDto,
    blogId: string,
    accessToken: string,
    validationFields?: { errorsMessages: ErrorsMessages[] },
    expectStatus: number = HttpStatus.NO_CONTENT,
  ) {
    const blogBefore = await this.getBlogBefore(blogId);
    await request(this.application)
      .put(this.routing.updateBlog(blogId))
      .auth(accessToken, this.constants.authBearer)
      .send(inputData)
      .expect(expectStatus)
      .expect(async ({ body }: SuperTestBody) => {
        if (validationFields) {
          expect(body).toEqual(validationFields);
        } else if (expectStatus === HttpStatus.NO_CONTENT) {
          const blogAfter = await this.getBlogByIdDirectly(blogId);
          expect(blogAfter).not.toEqual(blogBefore);
        }
      });
  }

  async updatePost(
    inputData: CreationPostDtoByBlogId,
    blogId: string,
    postId: string,
    accessToken: string,
    validationFields?: { errorsMessages: ErrorsMessages[] },
    expectStatus: number = HttpStatus.NO_CONTENT,
  ) {
    const postBefore = await this.getPostBefore(postId);
    await request(this.application)
      .put(this.routing.updatePost(blogId, postId))
      .auth(accessToken, this.constants.authBearer)
      .send(inputData)
      .expect(expectStatus)
      .expect(async ({ body }: SuperTestBody) => {
        if (validationFields) {
          expect(body).toEqual(validationFields);
        } else if (expectStatus === HttpStatus.NO_CONTENT) {
          const postAfter = await this.getPostByIdDirectly(postId);
          expect(postBefore).not.toEqual(postAfter);
        }
      });
  }

  checkBlogModel(
    responseModel:
      | BlogType
      | BlogsTypeWithId
      | PostViewModelType
      | { errorsMessages: ErrorsMessages[] }
      | any,
    expectedResult:
      | BlogType
      | BlogsTypeWithId
      | { errorsMessages: ErrorsMessages[] }
      | any
      | string,
  ) {
    expect(responseModel).toEqual(expectedResult);
  }

  private getBlogByIdDirectly = async (blogId: string) =>
    await this.blogRepository.findOneBy({ id: blogId });
  private getPostByIdDirectly = async (postId: string) =>
    await this.postRepository.findOneBy({ id: postId });

  async getBloggerBlogs(accessToken: string, expectedStatus = HttpStatus.OK) {
    let blogs: PaginationViewModel<BlogViewModelTypeWithImages>;
    await request(this.application)
      .get(this.routing.getBlogs())
      .auth(accessToken, this.constants.authBearer)
      .expect(expectedStatus)
      .expect(
        ({
          body,
        }: SuperTestBody<PaginationViewModel<BlogViewModelTypeWithImages>>) => {
          blogs = body;
        },
      );

    return blogs;
  }

  async getBloggerPosts(
    blogId: string,
    accessToken: string,
    expectStatus = HttpStatus.OK,
  ): Promise<PaginationViewModel<PostViewModelType>> {
    let postsPaging: PaginationViewModel<PostViewModelType>;
    await request(this.application)
      .get(this.routing.getPosts(blogId))
      .auth(accessToken, this.constants.authBearer)
      .expect(expectStatus)
      .expect(
        ({ body }: SuperTestBody<PaginationViewModel<PostViewModelType>>) => {
          const isSuccess = !body.errors;
          if (isSuccess) {
            expect(body).toEqual(paginationStructureConsistency());
            postsPaging = body;
            postsPaging.items.forEach((post) =>
              createdPostStructureConsistency(post),
            );
          }
        },
      );
    return postsPaging;
  }

  async deleteBlog(
    blogId: string,
    accessToken: string,
    expectStatus = HttpStatus.NO_CONTENT,
  ) {
    if (expectStatus !== HttpStatus.NO_CONTENT) {
      return request(this.application)
        .delete(this.routing.deleteBlog(blogId))
        .auth(accessToken, this.constants.authBearer)
        .expect(expectStatus);
    }

    let blogBeforeDelete = await this.getBlogByIdDirectly(blogId);

    expect(blogBeforeDelete).toBeDefined();

    await request(this.application)
      .delete(this.routing.deleteBlog(blogId))
      .auth(accessToken, this.constants.authBearer)
      .expect(HttpStatus.NO_CONTENT);

    let blogAfterDelete = await this.getBlogByIdDirectly(blogId);
    expect(blogAfterDelete).toBeNull();
  }

  async deletePost(
    blogId: string,
    postId: string,
    accessToken: string,
    expectStatus = HttpStatus.NO_CONTENT,
  ) {
    if (expectStatus !== HttpStatus.NO_CONTENT) {
      return request(this.application)
        .delete(this.routing.deletePost(blogId, postId))
        .auth(accessToken, this.constants.authBearer)
        .expect(expectStatus);
    }

    let blogBeforeDelete = await this.getPostByIdDirectly(postId);

    expect(blogBeforeDelete).toBeDefined();

    await request(this.application)
      .delete(this.routing.deletePost(blogId, postId))
      .auth(accessToken, this.constants.authBearer)
      .expect(expectStatus);

    let blogAfterDelete = await this.getPostByIdDirectly(postId);
    expect(blogAfterDelete).toBeNull();
  }

  async createBlogsForFurtherTests(accessTokens: string[], blogsQuantity = 2) {
    const createdBlogs = [];
    const doPush = Array.prototype.push.bind(createdBlogs);
    for (let i = 0; i < blogsQuantity; i++) {
      const tokenIdx = i % accessTokens.length;
      const blog = await this.createBlog(
        this.createInputData({
          name: blogsData.philosophers[i],
          description: blogsData.description[i + 1],
          websiteUrl: blogsData.websiteUrl[i + 1],
        }),
        accessTokens[tokenIdx],
      );
      doPush(blog);
    }
    return createdBlogs;
  }
}

type FileDimensions = {
  width: number;
  height: number;
};

const fileExtensions = ['png', 'jpeg', 'jpg'];
