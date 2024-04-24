import { HttpServer, HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { BlogViewModelType } from '../../src/features/blogs/api/controllers';
import {
  blogEqualTo,
  blogValidationErrors,
  createSABlogsDataForTests,
} from '../tools/helpers/blogs.helpers';
import { BasicAuthorization } from '../tools/managers/BasicAuthManager';
import { BlogsTestManager } from '../tools/managers/BlogsTestManager';
import { UsersTestManager } from '../tools/managers/UsersTestManager';
import {
  PaginationModel,
  removeUnwantedFields,
} from '../tools/models/pagination-model';
import { aDescribe } from '../tools/utils/aDescribe';
import { initSettings } from '../tools/utils/initSettings';
import { skipSettings } from '../tools/utils/testsSettings';
import { PostsTestManager } from '../tools/managers/PostsTestManager';
import { cleanDatabase } from '../tools/utils/dataBaseCleanup';
import { createExceptions } from '../tools/utils/exceptionHandlers';
import { constants } from '../tools/helpers/constants';

interface IBlogsPagination {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: Array<{
    [key: string]: any;
  }>;
}
aDescribe(skipSettings.for('staging'))('SABlogsController (e2e)', () => {
  let app: INestApplication;
  let httpServer: HttpServer
  let testingAppModule: TestingModule;
  let postTestManager: PostsTestManager;
  let blogTestManager: BlogsTestManager;
  let basicAuthManager: BasicAuthorization;
  let usersTestManager: UsersTestManager;
  let dataBase: DataSource;
  let paginationModel: PaginationModel<BlogViewModelType>;

  beforeAll(async () => {
    const result = await initSettings();

    testingAppModule = result.testingAppModule;
    usersTestManager = result.usersTestManager;

    dataBase = testingAppModule.get<DataSource>(DataSource);
    app = result.app;
    httpServer = result.httpServer
    postTestManager = new PostsTestManager(app);
    blogTestManager = new BlogsTestManager(app, 'sa_blogs');
    basicAuthManager = new BasicAuthorization(app);

    paginationModel = new PaginationModel();
  });

  afterAll(async () => {
    await cleanDatabase(httpServer);
    await app.close();
  });

  beforeEach(async () => {
    const inputData1 = usersTestManager.createInputData({
      login: 'log1',
      email: 'email1@em.ru1',
    });
    const inputData2 = usersTestManager.createInputData({
      login: 'log2',
      email: 'email2@em.ru2',
    });

    const createBlogData = blogTestManager.createInputData({});

    const sa = await usersTestManager.createSA(inputData1);
    const sa2 = await usersTestManager.createSA(inputData2);

    const { accessToken, refreshToken } =
      await usersTestManager.authLogin(inputData1);

    const { accessToken: accessToken2, refreshToken: refreshToken2 } =
      await usersTestManager.authLogin(inputData2);

    const blog = await blogTestManager.createSABlog(
      createBlogData,
      accessToken
    );

    const createBlogData2 = blogTestManager.createInputData({
      name: 'August',
    });

    const blog2 = await blogTestManager.createSABlog(
      createBlogData2,
      accessToken2
    );

    expect.setState({
      accessToken,
      accessToken2,
      refreshToken,
      correctInputBlogData: createBlogData,
      blog,
      blog2,
    });
  });

  describe.skip('testing create blog', () => {
    afterAll(async () => {
      await cleanDatabase(httpServer);
    });

    it('/sa/blogs (GET)', async () => {
      const { accessToken } = expect.getState();
      const expectBlogsCount = 2;
      await blogTestManager.checkBlogsBeforeTests(
        accessToken,
        expectBlogsCount
      );
    });

    it("/sa/blogs (post) - shouldn't create blog without auth", async () => {
      await basicAuthManager.testPostAuthorization('blogs');
    });

    it("/sa/blogs (POST) - shouldn't create blog with empty body ", async () => {
      const { accessToken } = expect.getState();
      const inputData = blogTestManager.createInputData();

      const newBlog = await blogTestManager.createSABlog(
        inputData,
        accessToken,
        HttpStatus.BAD_REQUEST
      );

      blogTestManager.checkBlogModel(newBlog, blogValidationErrors);
    });

    it("/sa/blogs (POST) - shouldn't create blog with incorrect blog name", async () => {
      const { accessToken } = expect.getState();

      const inputDataShortLen = blogTestManager.createInputData({
        name: constants.inputData.length02,
      });

      const res1 = await blogTestManager.createSABlog(
        inputDataShortLen,
        accessToken,
        HttpStatus.BAD_REQUEST
      );

      const error = createExceptions(['name']);
      blogTestManager.assertBlogsMatch(res1, error);

      const inputDataOverLenName = blogTestManager.createInputData({
        name: constants.inputData.length16,
      });

      const res2 = await blogTestManager.createSABlog(
        inputDataOverLenName,
        accessToken,
        HttpStatus.BAD_REQUEST
      );

      const error2 = createExceptions(['name']);
      blogTestManager.assertBlogsMatch(res2, error2);
    });
    it("/sa/blogs (POST) - shouldn't create blog with incorrect blog description", async () => {
      const { accessToken } = expect.getState();

      const shortDescription = blogTestManager.createInputData({
        description: constants.inputData.length02,
      });

      const res1 = await blogTestManager.createSABlog(
        shortDescription,
        accessToken,
        HttpStatus.BAD_REQUEST
      );

      const error = createExceptions(['description']);
      blogTestManager.assertBlogsMatch(res1, error);

      const longDescription = blogTestManager.createInputData({
        description: constants.inputData.length501,
      });

      const res2 = await blogTestManager.createSABlog(
        longDescription,
        accessToken,
        HttpStatus.BAD_REQUEST
      );

      const error2 = createExceptions(['description']);
      blogTestManager.assertBlogsMatch(res2, error2);
    });
    it("/sa/blogs (POST) - shouldn't create blog with incorrect website url", async () => {
      const { accessToken } = expect.getState();

      const shortWebsiteUrl = blogTestManager.createInputData({
        websiteUrl: constants.inputData.length02,
      });

      const res1 = await blogTestManager.createSABlog(
        shortWebsiteUrl,
        accessToken,
        HttpStatus.BAD_REQUEST
      );

      const error = createExceptions(['websiteUrl']);
      blogTestManager.assertBlogsMatch(res1, error);

      const longWebsiteUrl = blogTestManager.createInputData({
        websiteUrl: constants.inputData.length101,
      });

      const res2 = await blogTestManager.createSABlog(
        longWebsiteUrl,
        accessToken,
        HttpStatus.BAD_REQUEST
      );

      const error2 = createExceptions(['websiteUrl']);
      blogTestManager.assertBlogsMatch(res2, error2);

      const doesNotMatchUrl = blogTestManager.createInputData({
        websiteUrl: 'websiteUrl',
      });

      const res3 = await blogTestManager.createSABlog(
        doesNotMatchUrl,
        accessToken,
        HttpStatus.BAD_REQUEST
      );

      const error3 = createExceptions(['websiteUrl']);
      blogTestManager.assertBlogsMatch(res3, error3);
    });
    it('/sa/blogs (post) - should create and return new blogs', async () => {
      await dataBase.query(`DELETE FROM blogs`);

      const { correctInputBlogData, accessToken, accessToken2 } =
        expect.getState();

      const blog = await blogTestManager.createSABlog(
        correctInputBlogData,
        accessToken
      );

      const createBlogData = blogTestManager.createInputData({
        name: 'August',
      });

      const blog2 = await blogTestManager.createSABlog(
        createBlogData,
        accessToken2
      );

      blogTestManager.checkBlogModel(blog, blogEqualTo);
      blogTestManager.assertBlogsMatch(blog.isMembership, true);

      await blogTestManager.checkStatusOptionId(blog.id, accessToken);

      const expectLength = 2;
      await blogTestManager.expectLength(expectLength, accessToken);
    });
  });

  describe.skip('testing update blog', () => {
    afterAll(async () => {
      await cleanDatabase(httpServer);
    });
    it("/sa/blogs (put) - shouldn't update blog without auth", async () => {
      const { accessToken, blog, blog2 } = expect.getState();

      await blogTestManager.checkStatusOptionId(blog.id, accessToken);

      await basicAuthManager.testPutAuthorization(
        'blogs',
        blog.id,
        HttpStatus.UNAUTHORIZED
      );
    });

    it("/sa/blogs (put) - shouldn't update blog incorrect blog id, 404", async () => {
      const { accessToken, blog, correctInputBlogData } = expect.getState();

      const invalidBlogId = blog.id.slice(-5);

      await blogTestManager.updateBlog(
        correctInputBlogData,
        invalidBlogId,
        accessToken,
        HttpStatus.NOT_FOUND
      );
    });

    it("/sa/blogs (put) - shouldn't update the blog with incorrect input data", async () => {
      const { accessToken, blog } = expect.getState();

      const invalidInputData = blogTestManager.createInputData();

      const result = await blogTestManager.updateBlog(
        invalidInputData,
        blog.id,
        accessToken,
        HttpStatus.BAD_REQUEST
      );

      blogTestManager.assertBlogsMatch(result.body, blogValidationErrors);

      const { blog: existingBlog } = await blogTestManager.checkStatusOptionId(
        blog.id,
        accessToken
      );

      blogTestManager.assertBlogsMatch(blog, existingBlog);
    });

    it("/sa/blogs (put) - shouldn't update the blog by foreign user, 403", async () => {
      const { accessToken, blog, blog2, accessToken2, correctInputBlogData } =
        expect.getState();

      const attempt1 = await blogTestManager.updateBlog(
        correctInputBlogData,
        blog.id,
        accessToken2,
        HttpStatus.FORBIDDEN
      );

      const { blog: existingBlog } = await blogTestManager.checkStatusOptionId(
        blog.id,
        accessToken
      );

      blogTestManager.assertBlogsMatch(blog, existingBlog);

      const attempt2 = await blogTestManager.updateBlog(
        correctInputBlogData,
        blog2.id,
        accessToken,
        HttpStatus.FORBIDDEN
      );

      const { blog: existingBlog2 } = await blogTestManager.checkStatusOptionId(
        blog2.id,
        accessToken
      );

      blogTestManager.assertBlogsMatch(blog2, existingBlog2);
    });

    it('/sa/blogs (put) - should update blog', async () => {
      const { blog, accessToken } = expect.getState();

      const beforeUpdate = await blogTestManager.checkStatusOptionId(
        blog.id,
        accessToken
      );
      blogTestManager.assertBlogsMatch(
        beforeUpdate.blog.name,
        'Marcus Aurelius'
      );

      const createOtherValidInputData = blogTestManager.createInputData({
        name: 'Zeno',
      });

      await blogTestManager.updateBlog(
        createOtherValidInputData,
        blog.id,
        accessToken
      );

      const afterUpdate = await blogTestManager.checkStatusOptionId(
        blog.id,
        accessToken
      );

      blogTestManager.assertBlogsMatch(afterUpdate.blog.name, 'Zeno');
    });
  });

  describe.skip('testing delete blog', () => {
    afterAll(async () => {
      await cleanDatabase(httpServer);
    });
    it('sa/blogs/:blogId - should not remove blog without auth, 401', async () => {
      const { blog } = expect.getState();

      await basicAuthManager.testDeleteAuthorization('sa_blogs', blog.id);
    });

    it("sa/blogs/:blogId - shouldn't remove blog with incorrect id, 404", async () => {
      const { blog, accessToken } = expect.getState();
      const invalidBlogId = blog.id.slice(-5);

      await blogTestManager.deleteSABlog(
        invalidBlogId,
        accessToken,
        HttpStatus.NOT_FOUND
      );
    });

    it('sa/blogs/:blogId - should not remove blog by foreign user, 403', async () => {
      const { blog, accessToken2 } = expect.getState();
      await blogTestManager.deleteSABlog(
        blog.id,
        accessToken2,
        HttpStatus.FORBIDDEN
      );
    });

    it('sa/blogs/:blogId - should remove blog and return not found, 204', async () => {
      const { blog, accessToken } = expect.getState();

      await blogTestManager.deleteSABlog(blog.id, accessToken);
    });
  });

  describe.skip('testing create post', () => {
    // afterAll(async () => {
    //   await cleanDatabase(httpServer);
    // });
    it(`sa/blogs/:blogId/posts (POST) - shouldn't create post without auth, 401`, async () => {
      const { blog } = expect.getState();

      await basicAuthManager.testPostAuthorization(
        'sa_blogs',
        blog.id,
        'posts'
      );
    });

    it(`sa/blogs/:blogId/posts (POST) - shouldn't create post with invalid title, 400`, async () => {
      const { blog, accessToken } = expect.getState();

      const incorrectInputData = blogTestManager.createPostInputData({
        title: constants.inputData.length02,
      });

      const result = await blogTestManager.createSAPost(
        incorrectInputData,
        blog,
        accessToken,
        HttpStatus.BAD_REQUEST
      );

      const error = createExceptions(['title']);

      blogTestManager.assertBlogsMatch(result, error);

      const incorrectInputData2 = blogTestManager.createPostInputData({
        title: constants.inputData.length31,
      });

      const result2 = await blogTestManager.createSAPost(
        incorrectInputData2,
        blog,
        accessToken,
        HttpStatus.BAD_REQUEST
      );

      const error2 = createExceptions(['title']);

      blogTestManager.assertBlogsMatch(result2, error2);
    });

    it(`sa/blogs/:blogId/posts (POST) - shouldn't create post with invalid description, 400`, async () => {
      const { blog, accessToken } = expect.getState();

      const incorrectInputData = blogTestManager.createPostInputData({
        shortDescription: constants.inputData.length02,
      });

      const result = await blogTestManager.createSAPost(
        incorrectInputData,
        blog,
        accessToken,
        HttpStatus.BAD_REQUEST
      );

      const error = createExceptions(['shortDescription']);

      blogTestManager.assertBlogsMatch(result, error);

      const incorrectInputData2 = blogTestManager.createPostInputData({
        shortDescription: constants.inputData.length101,
      });

      const result2 = await blogTestManager.createSAPost(
        incorrectInputData2,
        blog,
        accessToken,
        HttpStatus.BAD_REQUEST
      );

      const error2 = createExceptions(['shortDescription']);

      blogTestManager.assertBlogsMatch(result2, error2);
    });

    it(`sa/blogs/:blogId/posts (POST) - shouldn't create post with invalid content, 400`, async () => {
      const { blog, accessToken } = expect.getState();

      const incorrectInputData = blogTestManager.createPostInputData({
        content: constants.inputData.length02,
      });

      const result = await blogTestManager.createSAPost(
        incorrectInputData,
        blog,
        accessToken,
        HttpStatus.BAD_REQUEST
      );

      const error = createExceptions(['content']);

      blogTestManager.assertBlogsMatch(result, error);

      const incorrectInputData2 = blogTestManager.createPostInputData({
        content: constants.inputData.length1001,
      });

      const result2 = await blogTestManager.createSAPost(
        incorrectInputData2,
        blog,
        accessToken,
        HttpStatus.BAD_REQUEST
      );

      const error2 = createExceptions(['content']);

      blogTestManager.assertBlogsMatch(result2, error2);
    });

    it(`sa/blogs/:blogId/posts (POST) - shouldn't create post with all incorrect fields, testing error's messages, 400`, async () => {
      const { blog, accessToken } = expect.getState();

      const incorrectInputData = blogTestManager.createPostInputData();

      const result = await blogTestManager.createSAPost(
        incorrectInputData,
        blog,
        accessToken,
        HttpStatus.BAD_REQUEST
      );

      const errors = createExceptions(['title', 'shortDescription', 'content']);

      blogTestManager.assertBlogsMatch(result, errors);
    });

    it(`sa/blogs/:blogId/posts (POST) - shouldn't create post for blog by foreign user, 403`, async () => {
      const { blog, accessToken2 } = expect.getState();

      const inputCreatePostData = blogTestManager.createPostInputData({});

      await blogTestManager.createSAPost(
        inputCreatePostData,
        blog,
        accessToken2,
        HttpStatus.FORBIDDEN
      );

      expect.setState({ inputCreatePostData });
    });

    it(`sa/blogs/:blogId/posts (POST) - Try creating a post with an id of a blog that does not exist in test data, and assert that it fails or results in an error since the blog cannot be found, 404`, async () => {
      const { blog, accessToken, inputCreatePostData } = expect.getState();

      const invalidBlog = { ...blog, id: blog.id.slice(-5) };

      await blogTestManager.createSAPost(
        inputCreatePostData,
        invalidBlog,
        accessToken,
        HttpStatus.NOT_FOUND
      );

      expect.setState({ inputCreatePostData });
    });

    it(`sa/blogs/:blogId/posts (POST) - should create post for existing blog`, async () => {
      const { blog, inputCreatePostData, accessToken } = expect.getState();

      const beforeCreate = await blogTestManager.getPostsByBlogId(
        blog.id,
        accessToken
      );

      const post = await blogTestManager.createSAPost(
        inputCreatePostData,
        blog,
        accessToken
      );

      const afterCreate = await postTestManager.getPostById(
        post.id,
        accessToken
      );

      expect.setState({ post });
    });

    it(`sa/blogs/:blogId/posts (GET) - Retrieve post by blog ID endpoint returns expected post`, async () => {
      const { post, accessToken } = expect.getState();

      await blogTestManager.getPostsByBlogId(post.blogId, accessToken);
    });
  });

  describe.skip('testing update post', () => {
    it(`/sa/blogs/:blogId/:postId (PUT) - shouldn't update the post with whole incorrect input data, 400`, async () => {
      const { post, accessToken } = expect.getState();
      const invalidInputData = blogTestManager.createPostInputData();

      const result = await blogTestManager.updateSAPost(
        invalidInputData,
        post.blogId,
        post.id,
        accessToken,
        HttpStatus.BAD_REQUEST
      );

      const errors = createExceptions(['title', 'shortDescription', 'content']);

      postTestManager.checkPostData(result.body, errors);
    });

    it(`/sa/blogs/:blogId/:postId (PUT) - shouldn't update post with invalid post id and blog id, 404`, async () => {
      const { post, accessToken, blog } = expect.getState();
      const invalidPostId = post.id.slice(-5);
      const invalidBlogId = blog.id.slice(-5);

      const updatePostData = blogTestManager.createPostInputData({
        title: 'new title',
      });

      await blogTestManager.updateSAPost(
        updatePostData,
        post.blogId,
        invalidPostId,
        accessToken,
        HttpStatus.NOT_FOUND
      );

      await blogTestManager.updateSAPost(
        updatePostData,
        invalidBlogId,
        post.id,
        accessToken,
        HttpStatus.NOT_FOUND
      );

      expect.setState({ updatePostData });
    });

    it(`/sa/blogs/:blogId/:postId (PUT) - shouldn't update post by foreign user, 403`, async () => {
      const { post, accessToken2, updatePostData } = expect.getState();

      await blogTestManager.updateSAPost(
        updatePostData,
        post.blogId,
        post.id,
        accessToken2,
        HttpStatus.FORBIDDEN
      );
    });

    it('/sa/blogs/:blogId/:postId (PUT) - should update post', async () => {
      const { post, accessToken, updatePostData } = expect.getState();

      await blogTestManager.updateSAPost(
        updatePostData,
        post.blogId,
        post.id,
        accessToken
      );
    });
  });

  describe.skip('testing delete post', () => {
    afterAll(async () => {
      await cleanDatabase(httpServer);
    });

    it('sa/blogs/:blogId/:postId - should not remove post without token, 401', async () => {
      const { post, blog } = expect.getState();

      await basicAuthManager.testDeleteSAAuthorization(
        'sa_blogs',
        post.blogId,
        post.id
      );
    });

    it("sa/blogs/:blogId/:postId - shouldn't remove post with incorrect post and blog Id, 404", async () => {
      const { post, accessToken } = expect.getState();

      const invalidPostId = post.id.slice(-5);

      const invalidBlogId = post.blogId.slice(-5);

      await blogTestManager.deleteSAPost(
        invalidBlogId,
        invalidPostId,
        accessToken,
        HttpStatus.NOT_FOUND
      );
    });

    it('sa/blogs/:blogId/:postId - should not remove post by foreign user, 403', async () => {
      const { post, accessToken2 } = expect.getState();
      await blogTestManager.deleteSAPost(
        post.blogId,
        post.id,
        accessToken2,
        HttpStatus.FORBIDDEN
      );
    });

    it('sa/blogs/:blogId/postId - should remove blog, 204', async () => {
      const { blog, accessToken } = expect.getState();

      await blogTestManager.deleteSABlog(blog.id, accessToken);
    });
  });

  describe.skip(`testing blog pagination`, () => {
    afterAll(async () => {
      await cleanDatabase(httpServer);
    });

    beforeEach(async () => {
      await dataBase.query(
        `DELETE FROM blogs WHERE title LIKE 'Marcus%' OR title LIKE  'August' `
      );
    });

    it(`sa/blogs (GET)`, async () => {
      const { accessToken } = expect.getState();
      await blogTestManager.createBlogsForFurtherTests(accessToken);

      const databaseBlogs = await blogTestManager.getSABlogs(accessToken);

      const fieldsToRemove = ['id', 'createdAt'];

      const dataBaseBlogsData = removeUnwantedFields(
        databaseBlogs,
        fieldsToRemove
      );

      const mockBlogsForTest = createSABlogsDataForTests();

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
        fieldsToRemove
      );

      blogTestManager.assertBlogsMatch(
        dataBaseBlogsData,
        mockPaginationBlogsData
      );
    });
  });
});
