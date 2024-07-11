import { HttpServer, HttpStatus, INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import {
  LikeStatusType,
  LikesStatuses,
} from '../../../src/domain/reaction.models';
import {
  BlogViewModelType,
  CreateBlogInputDto,
  CreationPostDtoByBlogId,
  PaginationViewModel,
  PostViewModelType,
  SABlogsViewType,
  SortDirections,
  UpdateBlogInputDto,
} from '../../../src/features/blogs/api/controllers';
import {
  BlogType,
  BlogsTypeWithId,
} from '../../../src/features/blogs/api/models/output.blog.models/blog.models';
import { ErrorsMessages } from '../../../src/infra/utils/error-handler';
import {
  blogsData,
  createdPostStructureConsistency,
} from '../helpers/structure-validation.helpers';
import { SuperTestBody } from '../models/body.response.model';
import { BlogsRouting } from '../routes/blogs.routing';
import { Blog, Post } from '../../../src/settings';
import { PathMappings, RouterPaths } from '../helpers/routing';
import { ApiRouting } from '../routes/api.routing';

export const authBearer: { type: 'bearer' } = { type: 'bearer' };
export const authBasic: { type: 'basic' } = { type: 'basic' };
const _basicUser = 'admin';
const _basicPass = 'qwerty';

type SortedByFieldType<T> = {
  blogs: T[];
  field: keyof T;
  sortDirection: SortDirections;
};

export class BlogTestManager {
  protected readonly application: INestApplication<HttpServer>;
  protected readonly blogRoutes: ApiRouting;
  protected readonly blogRepository: Repository<Blog>;
  protected readonly postRepository: Repository<Post>;
  protected saBlogsManager: SABlogsTestManager;
  protected bloggerManager: BloggerBlogsTestManager;
  protected publicBlogsManager: PublicBlogsTestManager;
  constructor(protected readonly app: INestApplication) {
    this.application = this.app.getHttpServer();
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

  assertBlogsMatch(responseData: any, expectedResult: any) {
    expect(responseData).toEqual(expectedResult);
  }

  checkSortingByDateField(
    blogs: BlogViewModelType[],
    sortDirection: SortDirections,
    sortField: string,
  ) {
    blogs.forEach((blog, i) => {
      const currentGameField = new Date(blog[sortField]).getTime();
      const nextGameField = new Date(blogs[i + 1][sortField]).getTime();

      sortDirection === SortDirections.DESC
        ? expect(nextGameField).toBeLessThanOrEqual(currentGameField)
        : expect(currentGameField).toBeLessThanOrEqual(nextGameField);
    });
  }

  isSortedByField = <T>(sortData: SortedByFieldType<T>) => {
    let { field, blogs, sortDirection } = sortData;
    let isSorted = true;

    field = field === 'title' ? ('name' as any) : field;

    for (let i = 0; i < blogs.length - 1; i++) {
      const currentValue = blogs[i][field];
      const nextValue = blogs[i + 1][field];

      if (typeof currentValue === 'string' && typeof nextValue === 'string') {
        if (sortDirection === 'ASC') {
          if (currentValue.localeCompare(nextValue) > 0) {
            isSorted = false;
            break;
          }
        } else {
          if (currentValue.localeCompare(nextValue) < 0) {
            isSorted = false;
            break;
          }
        }
      } else if (
        typeof currentValue === 'number' &&
        typeof nextValue === 'number'
      ) {
        if (sortDirection === SortDirections.ASC) {
          if (currentValue > nextValue) {
            isSorted = false;
            break;
          }
        } else {
          if (currentValue < nextValue) {
            isSorted = false;
            break;
          }
        }
      } else if (currentValue instanceof Date && nextValue instanceof Date) {
        if (sortDirection === SortDirections.ASC) {
          if (currentValue.getTime() > nextValue.getTime()) {
            isSorted = false;
            break;
          }
        } else {
          if (currentValue.getTime() < nextValue.getTime()) {
            isSorted = false;
            break;
          }
        }
      } else {
        throw new Error(
          `Unsupported field type for sorting: ${typeof currentValue}`,
        );
      }
    }

    expect(isSorted).toBe(true);
  };
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
        .auth(token, authBearer)
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
      .auth(accessToken, authBearer)
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
      .auth(accessToken, authBearer)
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
      .auth(accessToken, authBearer)
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
      .auth(accessToken, authBearer)
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
      .expect(expectStatus);
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
    expectStatus: number = HttpStatus.OK,
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
        .auth(accessToken, authBearer)
        .expect(expectStatus);
    }

    let blogBeforeDelete = await this.getBlogByIdDirectly(blogId);

    expect(blogBeforeDelete).toBeDefined();

    await request(this.application)
      .delete(this.routing.deleteBlog(blogId))
      .auth(accessToken, authBearer)
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
      .auth(basicOptions ? _basicUser : '', _basicPass, authBasic)
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
      .auth(_basicUser, _basicPass, authBasic)
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
}

export class BloggerBlogsTestManager extends BlogTestManager {
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
        .auth(token, authBearer)
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
      .auth(accessToken, authBearer)
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
      .auth(accessToken, authBearer)
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
      .auth(accessToken, authBearer)
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
      .auth(accessToken, authBearer)
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

  assertBlogsMatch(responseData: any, expectedResult: any) {
    expect(responseData).toEqual(expectedResult);
  }

  private getBlogByIdDirectly = async (blogId: string) =>
    await this.blogRepository.findOneBy({ id: blogId });
  private getPostByIdDirectly = async (postId: string) =>
    await this.postRepository.findOneBy({ id: postId });

  async getBloggerBlogs(accessToken: string, expectedStatus = HttpStatus.OK) {
    let blogs: PaginationViewModel<BlogViewModelType>;
    await request(this.application)
      .get(this.routing.getBlogs())
      .auth(accessToken, authBearer)
      .expect(expectedStatus)
      .expect(
        ({ body }: SuperTestBody<PaginationViewModel<BlogViewModelType>>) => {
          blogs = body;
        },
      );

    return blogs;
  }

  async getBloggerPosts(
    blogId: string,
    accessToken: string,
    expectStatus: number = HttpStatus.OK,
  ) {
    const {
      body: { items: postViewModels },
    } = await request(this.application)
      .get(this.routing.getPosts(blogId))
      .auth(accessToken, authBearer)
      .expect(expectStatus);

    if (expectStatus === HttpStatus.OK) {
      postViewModels.forEach((post: PostViewModelType) => {
        expect(post).toEqual({
          id: expect.any(String),
          title: expect.any(String),
          shortDescription: expect.any(String),
          content: expect.any(String),
          blogId: expect.any(String),
          blogName: expect.any(String),
          createdAt: expect.any(String),
          extendedLikesInfo: {
            likesCount: expect.any(Number),
            dislikesCount: expect.any(Number),
            myStatus: expect.any(String),
            newestLikes: expect.any(Array),
          },
        } as PostViewModelType);
      });
    }
  }

  expectAmountOfBlogsOrPosts = async (
    expectLength: number,
    accessToken: string,
    blogId?: string,
  ) =>
    await request(this.application)
      .get(!blogId ? this.routing.getBlogs() : this.routing.getPosts(blogId))
      .auth(accessToken, authBearer)
      .expect(
        ({ body }: SuperTestBody<PaginationViewModel<BlogViewModelType>>) => {
          expect(body.items).toHaveLength(expectLength);
        },
      );

  async deleteBlog(
    blogId: string,
    accessToken: string,
    expectStatus = HttpStatus.NO_CONTENT,
  ) {
    if (expectStatus !== HttpStatus.NO_CONTENT) {
      return request(this.application)
        .delete(this.routing.deleteBlog(blogId))
        .auth(accessToken, authBearer)
        .expect(expectStatus);
    }

    let blogBeforeDelete = await this.getBlogByIdDirectly(blogId);

    expect(blogBeforeDelete).toBeDefined();

    await request(this.application)
      .delete(this.routing.deleteBlog(blogId))
      .auth(accessToken, authBearer)
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
        .auth(accessToken, authBearer)
        .expect(expectStatus);
    }

    let blogBeforeDelete = await this.getPostByIdDirectly(postId);

    expect(blogBeforeDelete).toBeDefined();

    await request(this.application)
      .delete(this.routing.deletePost(blogId, postId))
      .auth(accessToken, authBearer)
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
