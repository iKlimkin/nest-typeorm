import { HttpServer, HttpStatus, INestApplication } from '@nestjs/common';
import { BlogViewModelType } from '../../src/features/blogs/api/controllers';
import { configureTestSetup } from '../tools/fixtures/setup-environment';
import { constants } from '../tools/helpers/constants';
import { RouterPaths } from '../tools/helpers/routing';
import {
  blogEqualTo,
  blogValidationErrors,
} from '../tools/helpers/structure-validation.helpers';
import {
  BloggerBlogsTestManager,
  BlogTestManager,
  PublicBlogsTestManager,
} from '../tools/managers/BlogsTestManager';
import { UsersTestManager } from '../tools/managers/UsersTestManager';
import { PaginationModel } from '../tools/models/pagination-model';
import { aDescribe } from '../tools/utils/aDescribe';
import { cleanDatabase } from '../tools/utils/dataBaseCleanup';
import { createExceptions } from '../tools/utils/exceptionHandlers';
import { initSettings } from '../tools/utils/initSettings';
import { skipSettings } from '../tools/utils/testsSettings';

aDescribe(skipSettings.for('bloggerBlogs'))('BloggerController (e2e)', () => {
  let app: INestApplication;
  let bloggerTestManager: BloggerBlogsTestManager;
  let usersTestManager: UsersTestManager;
  let httpServer: HttpServer;
  let paginationModel: PaginationModel<BlogViewModelType>;
  let publicBlogsTestManager: PublicBlogsTestManager;

  beforeAll(async () => {
    try {
      const settings = await initSettings();
      app = settings.app;
      httpServer = settings.httpServer;

      const { createTestManager } = new BlogTestManager(app);
      const createManager = createTestManager.bind(new BlogTestManager(app));

      bloggerTestManager = createManager(
        RouterPaths.blogger,
      ) as BloggerBlogsTestManager;
      publicBlogsTestManager = createManager(
        RouterPaths.blogs,
      ) as PublicBlogsTestManager;

      usersTestManager = settings.usersTestManager;

      paginationModel = new PaginationModel();
    } catch (error) {
      console.error(error);
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('testing create blog (POST -> "blogger/blogs")', () => {
    afterAll(async () => {
      await cleanDatabase(httpServer);
    });

    beforeAll(async () => {
      await configureTestSetup(() => ({
        usersTestManager,
      }));
    });

    it("/blogger/blogs (post) - shouldn't create blog without token", async () => {
      await bloggerTestManager.createBlog(
        bloggerTestManager.createInputData({}),
        'token',
        HttpStatus.UNAUTHORIZED,
      );
    });

    it("/blogger/blogs (POST) - shouldn't create blog with incorrect blog name", async () => {
      const { firstPlayerToken } = expect.getState();

      const inputDataShortLen = bloggerTestManager.createInputData({
        name: constants.inputData.length02,
      });

      const res1 = await bloggerTestManager.createBlog(
        inputDataShortLen,
        firstPlayerToken,
        HttpStatus.BAD_REQUEST,
      );

      const error = createExceptions(['name']);
      bloggerTestManager.assertBlogsMatch(res1, error);

      const inputDataOverLenName = bloggerTestManager.createInputData({
        name: constants.inputData.length16,
      });

      const res2 = await bloggerTestManager.createBlog(
        inputDataOverLenName,
        firstPlayerToken,
        HttpStatus.BAD_REQUEST,
      );

      const error2 = createExceptions(['name']);
      bloggerTestManager.assertBlogsMatch(res2, error2);
    });
    it("/blogger/blogs (POST) - shouldn't create blog with incorrect blog description", async () => {
      const { firstPlayerToken } = expect.getState();

      const shortDescription = bloggerTestManager.createInputData({
        description: constants.inputData.length02,
      });

      const res1 = await bloggerTestManager.createBlog(
        shortDescription,
        firstPlayerToken,
        HttpStatus.BAD_REQUEST,
      );

      const error = createExceptions(['description']);
      bloggerTestManager.assertBlogsMatch(res1, error);

      const longDescription = bloggerTestManager.createInputData({
        description: constants.inputData.length501,
      });

      const res2 = await bloggerTestManager.createBlog(
        longDescription,
        firstPlayerToken,
        HttpStatus.BAD_REQUEST,
      );

      const error2 = createExceptions(['description']);
      bloggerTestManager.assertBlogsMatch(res2, error2);
    });
    it("/blogger/blogs (POST) - shouldn't create blog with incorrect website url", async () => {
      const { firstPlayerToken } = expect.getState();

      const shortWebsiteUrl = bloggerTestManager.createInputData({
        websiteUrl: constants.inputData.length02,
      });

      const res1 = await bloggerTestManager.createBlog(
        shortWebsiteUrl,
        firstPlayerToken,
        HttpStatus.BAD_REQUEST,
      );

      const error = createExceptions(['websiteUrl']);
      bloggerTestManager.assertBlogsMatch(res1, error);

      const longWebsiteUrl = bloggerTestManager.createInputData({
        websiteUrl: constants.inputData.length101,
      });

      const res2 = await bloggerTestManager.createBlog(
        longWebsiteUrl,
        firstPlayerToken,
        HttpStatus.BAD_REQUEST,
      );

      const error2 = createExceptions(['websiteUrl']);
      bloggerTestManager.assertBlogsMatch(res2, error2);

      const doesNotMatchUrl = bloggerTestManager.createInputData({
        websiteUrl: 'websiteUrl',
      });

      const res3 = await bloggerTestManager.createBlog(
        doesNotMatchUrl,
        firstPlayerToken,
        HttpStatus.BAD_REQUEST,
      );

      const error3 = createExceptions(['websiteUrl']);
      bloggerTestManager.assertBlogsMatch(res3, error3);
    });

    it("/blogger/blogs (POST) - shouldn't create blog with empty body ", async () => {
      const { firstPlayerToken } = expect.getState();

      const inputData = bloggerTestManager.createInputData();

      const newBlog = await bloggerTestManager.createBlog(
        inputData,
        firstPlayerToken,
        HttpStatus.BAD_REQUEST,
      );

      bloggerTestManager.assertBlogsMatch(newBlog, blogValidationErrors);
    });

    it('/blogger/blogs (post) - should create blog', async () => {
      const { firstPlayerToken } = expect.getState();
      const inputData = bloggerTestManager.createInputData({});
      const blog = await bloggerTestManager.createBlog(
        inputData,
        firstPlayerToken,
      );

      bloggerTestManager.assertBlogsMatch(blog, blogEqualTo);

      const expectLength = 1;
      await bloggerTestManager.expectAmountOfBlogsOrPosts(
        expectLength,
        firstPlayerToken,
      );
    });
  });

  describe('testing update blog (PUT -> "blogger/blogs/:blogId")', () => {
    afterAll(async () => {
      await cleanDatabase(httpServer);
    });
    beforeAll(async () => {
      await configureTestSetup(() => ({
        usersTestManager,
      }));
    });

    it("/blogger/blogs/:id (put) - shouldn't update blog without auth", async () => {
      const { firstPlayerToken } = expect.getState();

      const correctInputData = bloggerTestManager.createInputData({});

      const blog = await bloggerTestManager.createBlog(
        correctInputData,
        firstPlayerToken,
      );
      const blogId = blog.id;
      await bloggerTestManager.updateBlog(
        correctInputData,
        blogId,
        'token',
        null,
        HttpStatus.UNAUTHORIZED,
      );

      expect.setState({ blogId, correctInputData });
    });

    it("/blogger/blogs (put) - shouldn't update the blog with incorrect input data", async () => {
      const { blogId, firstPlayerToken } = expect.getState();

      const invalidInputData = bloggerTestManager.createInputData();

      await bloggerTestManager.updateBlog(
        invalidInputData,
        blogId,
        firstPlayerToken,
        blogValidationErrors,
        HttpStatus.BAD_REQUEST,
      );
    });

    it("/blogger/blogs (put) - shouldn't update the blog with incorrect blogId", async () => {
      const { firstPlayerToken, correctInputData } = expect.getState();

      await bloggerTestManager.updateBlog(
        correctInputData,
        'blogId',
        firstPlayerToken,
        null,
        HttpStatus.NOT_FOUND,
      );
    });
    it("/blogger/blogs (put) - shouldn't update the blog by foreign user, 403", async () => {
      const { firstPlayerToken, secondPlayerToken, blogId } = expect.getState();
      const createBlogData = bloggerTestManager.createInputData({
        name: 'otherBlogName',
      });

      const anotherBlog = await bloggerTestManager.createBlog(
        createBlogData,
        secondPlayerToken,
      );
      const secondBlogId = anotherBlog.id;

      const firstAttemptToUpdate = await bloggerTestManager.updateBlog(
        createBlogData,
        blogId,
        secondPlayerToken,
        null,
        HttpStatus.FORBIDDEN,
      );

      const secondAttemptToUpdate = await bloggerTestManager.updateBlog(
        createBlogData,
        secondBlogId,
        firstPlayerToken,
        null,
        HttpStatus.FORBIDDEN,
      );
    });

    it('/blogger/blogs (put) - should update blog', async () => {
      const { blogId, firstPlayerToken } = expect.getState();

      const updatedBlogField = bloggerTestManager.createInputData({
        name: 'Zeno',
      });

      await bloggerTestManager.updateBlog(
        updatedBlogField,
        blogId,
        firstPlayerToken,
      );
    });
  });

  describe('testing delete blog (DELETE -> "blogger/blogs/:blogId")', () => {
    afterAll(async () => {
      await cleanDatabase(httpServer);
    });
    beforeAll(async () => {
      await configureTestSetup(() => ({
        usersTestManager,
      }));
    });

    it('blogger/blogs/:blogId (DELETE) - should not remove blog without auth, 401', async () => {
      const { firstPlayerToken } = expect.getState();
      const correctInputData = bloggerTestManager.createInputData({});

      const blog = await bloggerTestManager.createBlog(
        correctInputData,
        firstPlayerToken,
      );
      const blogId = blog.id;
      await bloggerTestManager.deleteBlog(
        blogId,
        'token',
        HttpStatus.UNAUTHORIZED,
      );

      expect.setState({ blogId });
    });

    it("blogger/blogs/:blogId (DELETE) - shouldn't remove blog with incorrectId, 404", async () => {
      const { firstPlayerToken } = expect.getState();
      await bloggerTestManager.deleteBlog(
        'blogId',
        firstPlayerToken,
        HttpStatus.NOT_FOUND,
      );
    });

    it("blogger/blogs/:blogId (DELETE) - shouldn't remove blog by another user, 403", async () => {
      const { secondPlayerToken, blogId } = expect.getState();

      await bloggerTestManager.deleteBlog(
        blogId,
        secondPlayerToken,
        HttpStatus.FORBIDDEN,
      );
    });

    it('blogger/blogs/:blogId (DELETE) - should remove blog, 204', async () => {
      const { blogId, firstPlayerToken } = expect.getState();

      await bloggerTestManager.deleteBlog(blogId, firstPlayerToken);
      const blogsAfter = await publicBlogsTestManager.getPublicBlog(
        blogId,
        HttpStatus.NOT_FOUND,
      );
    });
  });

  describe.only('testing get blogs (GET -> "blogger/blogs")', () => {
    afterAll(async () => {
      await cleanDatabase(httpServer);
    });
    beforeAll(async () => {
      await configureTestSetup(
        () => ({
          usersTestManager,
          bloggerTestManager,
        }),
        { blogs: { quantity: 15 } },
      );
    });

    it('/blogger/blogs (GET) - should return blogs created by blogger', async () => {
      const { firstPlayerToken } = expect.getState();

      const blogsResponse = await bloggerTestManager.getBloggerBlogs(
        firstPlayerToken,
      );

      const blogs = blogsResponse.items;
      expect(blogsResponse.totalCount).toBe(8);

      // bloggerTestManager.assertBlogsMatch(blogs, expectLength);
    });

    it('/blogger/blogs (GET) - should return blogs with pagination', async () => {
      const { firstPlayerToken } = expect.getState();

      // const blogs = await publicBlogsTestManager.getPublicBlogs(
      //   firstPlayerToken,
      //   paginationModel,
      // );
      // const expectLength = 1;
      // bloggerTestManager.assertBlogsMatch(blogs, expectLength);
    });
  });

  describe(`testing create post by blogId (POST)`, () => {
    afterAll(async () => {
      await cleanDatabase(httpServer);
    });

    beforeAll(async () => {
      await configureTestSetup(
        () => ({
          usersTestManager,
          bloggerTestManager,
        }),
        { blogs: true },
      );
    });

    it(`/blogger/blogs/:blogId/posts (POST) - shouldn't create post without auth, 401`, async () => {
      const { blogByFirstToken } = expect.getState();
      const postInputData = bloggerTestManager.createPostInputData({});
      await bloggerTestManager.createPost(
        postInputData,
        'token',
        blogByFirstToken.id,
        HttpStatus.UNAUTHORIZED,
      );
    });

    it(`/blogger/blogs/:blogId/posts (POST) - shouldn't create post with invalid title, 404`, async () => {
      const { firstPlayerToken, blogByFirstToken } = expect.getState();

      const inputDataShortTitle = bloggerTestManager.createPostInputData({
        title: constants.inputData.length01,
      });
      const inputDataLongTitle = bloggerTestManager.createPostInputData({
        title: constants.inputData.length31,
      });

      const result1 = await bloggerTestManager.createPost(
        inputDataShortTitle,
        firstPlayerToken,
        blogByFirstToken.id,
        HttpStatus.BAD_REQUEST,
      );

      const result2 = await bloggerTestManager.createPost(
        inputDataLongTitle,
        firstPlayerToken,
        blogByFirstToken.id,
        HttpStatus.BAD_REQUEST,
      );

      const error = createExceptions(['title']);

      bloggerTestManager.assertBlogsMatch(result1, error);
      bloggerTestManager.assertBlogsMatch(result2, error);
    });

    it(`/blogger/blogs/:blogId/posts (POST) - shouldn't create post with invalid description`, async () => {
      const { firstPlayerToken, blogByFirstToken } = expect.getState();

      const incorrectInputData = bloggerTestManager.createPostInputData({
        shortDescription: constants.inputData.length01,
      });

      const result = await bloggerTestManager.createPost(
        incorrectInputData,
        firstPlayerToken,
        blogByFirstToken.id,
        HttpStatus.BAD_REQUEST,
      );

      const error = createExceptions(['shortDescription']);

      bloggerTestManager.assertBlogsMatch(result, error);
    });

    it(`/blogs/:blogId/posts (POST) - shouldn't create post with invalid content`, async () => {
      const { firstPlayerToken, blogByFirstToken } = expect.getState();

      const shortContentInputData = bloggerTestManager.createPostInputData({
        content: constants.inputData.length02,
      });
      const longContentInputData = bloggerTestManager.createPostInputData({
        content: constants.inputData.length1001,
      });

      const result1 = await bloggerTestManager.createPost(
        shortContentInputData,
        firstPlayerToken,
        blogByFirstToken.id,
        HttpStatus.BAD_REQUEST,
      );

      const result2 = await bloggerTestManager.createPost(
        longContentInputData,
        firstPlayerToken,
        blogByFirstToken.id,
        HttpStatus.BAD_REQUEST,
      );

      const error = createExceptions(['content']);

      bloggerTestManager.assertBlogsMatch(result1, error);
      bloggerTestManager.assertBlogsMatch(result2, error);
    });

    it(`/blogs/:blogId/posts (POST) - shouldn't create post with all incorrect fields, testing error's messages`, async () => {
      const { firstPlayerToken, blogByFirstToken } = expect.getState();

      const incorrectInputData = bloggerTestManager.createPostInputData();

      const result = await bloggerTestManager.createPost(
        incorrectInputData,
        firstPlayerToken,
        blogByFirstToken.id,
        HttpStatus.BAD_REQUEST,
      );

      const errors = createExceptions(['title', 'shortDescription', 'content']);

      bloggerTestManager.assertBlogsMatch(result, errors);
    });

    it(`/blogger/blogs/:blogId/posts (POST) - should create post`, async () => {
      const { firstPlayerToken, blogByFirstToken } = expect.getState();

      const inputPostData = bloggerTestManager.createPostInputData({});
      const blogId = blogByFirstToken.id;

      const createdPost = await bloggerTestManager.createPost(
        inputPostData,
        firstPlayerToken,
        blogId,
      );

      const expectAmountOfPosts = 1;
      await bloggerTestManager.expectAmountOfBlogsOrPosts(
        expectAmountOfPosts,
        firstPlayerToken,
        blogId,
      );
    });
  });

  describe('testing update post (PUT)', () => {
    afterAll(async () => {
      await cleanDatabase(httpServer);
    });

    beforeAll(async () => {
      await configureTestSetup(
        () => ({
          usersTestManager,
          bloggerTestManager,
        }),
        { posts: true },
      );
    });

    it(`/blogger/blogs/:blogId/:postId (PUT) - shouldn't update the post with whole incorrect input data, 400`, async () => {
      const { postByFirstToken, firstPlayerToken } = expect.getState();
      const invalidInputData = bloggerTestManager.createPostInputData();

      const validationFields = createExceptions([
        'title',
        'shortDescription',
        'content',
      ]);

      await bloggerTestManager.updatePost(
        invalidInputData,
        postByFirstToken.blogId,
        postByFirstToken.id,
        firstPlayerToken,
        validationFields,
        HttpStatus.BAD_REQUEST,
      );
    });

    it(`/blogger/blogs/:blogId/:postId (PUT) - shouldn't update post with invalid post id and blog id, 404`, async () => {
      const { postByFirstToken, firstPlayerToken } = expect.getState();

      const updatePostData = bloggerTestManager.createPostInputData({
        title: 'new title',
      });

      await bloggerTestManager.updatePost(
        updatePostData,
        postByFirstToken.blogId,
        'invalidPostId',
        firstPlayerToken,
        null,
        HttpStatus.NOT_FOUND,
      );

      await bloggerTestManager.updatePost(
        updatePostData,
        'invalidBlogId',
        postByFirstToken.id,
        firstPlayerToken,
        null,
        HttpStatus.NOT_FOUND,
      );
    });

    it(`/blogger/blogs/:blogId/:postId (PUT) - shouldn't update post by foreign user, 403`, async () => {
      const { postByFirstToken, secondPlayerToken } = expect.getState();

      const updatePostData = bloggerTestManager.createPostInputData({
        title: 'new title',
      });

      await bloggerTestManager.updatePost(
        updatePostData,
        postByFirstToken.blogId,
        postByFirstToken.id,
        secondPlayerToken,
        null,
        HttpStatus.FORBIDDEN,
      );
    });

    it('/blogger/blogs/:blogId/:postId (PUT) - should update post', async () => {
      const {
        postByFirstToken,
        firstPlayerToken,
        postBySecondToken,
        secondPlayerToken,
      } = expect.getState();

      const updatePostData = bloggerTestManager.createPostInputData({
        title: 'new title',
      });

      await bloggerTestManager.updatePost(
        updatePostData,
        postByFirstToken.blogId,
        postByFirstToken.id,
        firstPlayerToken,
      );

      await bloggerTestManager.updatePost(
        updatePostData,
        postBySecondToken.blogId,
        postBySecondToken.id,
        secondPlayerToken,
      );
    });
  });
  describe('testing delete post (DELETE)', () => {
    afterAll(async () => {
      await cleanDatabase(httpServer);
    });
    beforeAll(async () => {
      await configureTestSetup(
        () => ({
          usersTestManager,
          bloggerTestManager,
        }),
        { posts: true },
      );
    });

    it('/blogger/blogs/:blogId/:postId - should not remove post without token, 401', async () => {
      const { postByFirstToken } = expect.getState();

      await bloggerTestManager.deletePost(
        postByFirstToken.blogId,
        postByFirstToken.id,
        'token',
        HttpStatus.UNAUTHORIZED,
      );
    });

    it("/blogger/blogs/:blogId/:postId - shouldn't remove post with incorrect post and blog Id, 404", async () => {
      const { postByFirstToken, firstPlayerToken } = expect.getState();

      await bloggerTestManager.deletePost(
        postByFirstToken.blogId,
        'invalidPostId',
        firstPlayerToken,
        HttpStatus.NOT_FOUND,
      );
      await bloggerTestManager.deletePost(
        'invalidBlogId',
        postByFirstToken.id,
        firstPlayerToken,
        HttpStatus.NOT_FOUND,
      );
    });

    it("/blogger/blogs/:blogId/:postId - shouldn't remove post by foreign user, 403", async () => {
      const {
        postByFirstToken,
        secondPlayerToken,
        postBySecondToken,
        firstPlayerToken,
      } = expect.getState();

      await bloggerTestManager.deletePost(
        postByFirstToken.blogId,
        postByFirstToken.id,
        secondPlayerToken,
        HttpStatus.FORBIDDEN,
      );
      await bloggerTestManager.deletePost(
        postBySecondToken.blogId,
        postBySecondToken.id,
        firstPlayerToken,
        HttpStatus.FORBIDDEN,
      );
    });

    it('/blogger/blogs/:blogId/posts/:postId - should remove post, 204', async () => {
      const { postByFirstToken, firstPlayerToken } = expect.getState();

      await bloggerTestManager.deletePost(
        postByFirstToken.blogId,
        postByFirstToken.id,
        firstPlayerToken,
      );
    });
  });

  describe('testing get posts', () => {
    afterAll(async () => {
      await cleanDatabase(httpServer);
    });

    beforeAll(async () => {
      await configureTestSetup(
        () => ({
          usersTestManager,
          bloggerTestManager,
        }),
        { posts: { quantity: 10 } },
      );
    });

    it(`shouldn't receive blogger posts by blog id without auth, 401`, async () => {
      const { blogByFirstToken } = expect.getState();

      await bloggerTestManager.getBloggerPosts(
        blogByFirstToken.id,
        'token',
        HttpStatus.UNAUTHORIZED,
      );
    });
    it(`shouldn't receive blogger posts by blog id by foreign user, 403`, async () => {
      const { secondPlayerToken, blogByFirstToken } = expect.getState();

      await bloggerTestManager.getBloggerPosts(
        blogByFirstToken.id,
        secondPlayerToken,
        HttpStatus.FORBIDDEN,
      );
    });
    it(`shouldn't receive blogger posts by invalid blog id, 404`, async () => {
      const { secondPlayerToken } = expect.getState();

      await bloggerTestManager.getBloggerPosts(
        'blogId',
        secondPlayerToken,
        HttpStatus.NOT_FOUND,
      );
    });
    it('should receive blogger posts by blog id', async () => {
      const { firstPlayerToken, blogByFirstToken } = expect.getState();

      await bloggerTestManager.getBloggerPosts(
        blogByFirstToken.id,
        firstPlayerToken,
      );
    });
  });
});

/**
 * describe.skip(`testing blog pagination`, () => {
    afterAll(async () => {
      await cleanDatabase(httpServer);
    });

    beforeEach(async () => {
      await dataSource.query(
        `DELETE FROM blogs WHERE title LIKE 'Marcus%' OR title LIKE  'August' `,
      );
    });

    it(`sa/blogs (GET)`, async () => {
      const { accessToken } = expect.getState();
      await bloggerTestManager.createBlogsForFurtherTests(accessToken);

      const databaseBlogs = await bloggerTestManager.getSABlogs(accessToken);

      const fieldsToRemove = ['id', 'createdAt'];

      const dataBaseBlogsData = removeUnwantedFields(
        databaseBlogs,
        fieldsToRemove,
      );

      const mockBlogsForTest = createBlogsDataForTests();

      const mockBlogsData = {
        pagesCount: 1,
        page: 1,
        pageSize: 10,
        totalCount: 9,
        items: mockBlogsForTest,
      };

      const mockPaginationBlogsData = paginationModel.getData(
        mockBlogsData,
        {
          sortDirection: 'desc',
          hide: 'createdAt',
        },
        fieldsToRemove,
      );

      bloggerTestManager.assertBlogsMatch(
        dataBaseBlogsData,
        mockPaginationBlogsData,
      );
    });
  });
 */
