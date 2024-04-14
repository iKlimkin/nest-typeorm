import { HttpStatus, INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  blogEqualTo,
  blogValidationErrors,
} from '../tools/helpers/blogs.helpers';
import { BasicAuthorization } from '../tools/managers/BasicAuthManager';
import { BlogsTestManager } from '../tools/managers/BlogsTestManager';
import { aDescribe } from '../tools/utils/aDescribe';
import { cleanDatabase } from '../tools/utils/dataBaseCleanup';
import { createExceptions } from '../tools/utils/exceptionHandlers';
import { initSettings } from '../tools/utils/initSettings';
import { skipSettings } from '../tools/utils/testsSettings';

aDescribe(skipSettings.for('blogs'))('BlogsController (e2e)', () => {
  let app: INestApplication;
  let blogTestManager: BlogsTestManager;
  let basicAuthManager: BasicAuthorization;
  let dataSource: DataSource;

  beforeAll(async () => {
    const { testingAppModule, app } = await initSettings();

    dataSource = testingAppModule.get(DataSource);

    blogTestManager = new BlogsTestManager(app, 'blogs');
    basicAuthManager = new BasicAuthorization(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('createBlog', () => {
    afterAll(async () => {
      await cleanDatabase(app);
    });

    it("/blogs (post) - shouldn't create blog without auth", async () => {
      const inputData = blogTestManager.createInputData({});

      await basicAuthManager.testPostAuthorization('blogs');

      expect.setState({ correctInputData: inputData });
    });

    it("/blogs (POST) - shouldn't create blog with empty body ", async () => {
      const inputData = blogTestManager.createInputData();

      const newBlog = await blogTestManager.createBlog(
        inputData,
        HttpStatus.BAD_REQUEST
      );

      blogTestManager.assertBlogsMatch(newBlog, blogValidationErrors);
    });

    it('/blogs (post) - should create and return new blog', async () => {
      const { correctInputData } = expect.getState();

      const newBlog = await blogTestManager.createBlog(correctInputData);

      blogTestManager.assertBlogsMatch(newBlog, blogEqualTo);
      const expectLength = 1;

      await blogTestManager.checkStatusOptionId(newBlog.id);
      await blogTestManager.expectLength(expectLength);
    });
  });

  describe('testing update blog (PUT)', () => {
    afterAll(async () => {
      await cleanDatabase(app);
    });

    it("/blogs (put) - shouldn't update blog without auth", async () => {
      const correctInputData = blogTestManager.createInputData({});

      const blog = await blogTestManager.createBlog(correctInputData);

      await blogTestManager.checkStatusOptionId(blog.id);

      await basicAuthManager.testPutAuthorization(
        'blogs',
        blog.id,
        HttpStatus.UNAUTHORIZED
      );
      expect.setState({ blog, correctInputData });
    });

    it("/blogs (put) - shouldn't update the blog with incorrect input data", async () => {
      const { blog } = expect.getState();

      const invalidInputData = blogTestManager.createInputData();

      const result = await blogTestManager.updateBlog(
        invalidInputData,
        blog.id,
        null,
        HttpStatus.BAD_REQUEST
      );

      blogTestManager.assertBlogsMatch(result.body, blogValidationErrors);

      const { blog: existingBlog } = await blogTestManager.getBlogById(blog.id);

      blogTestManager.assertBlogsMatch(blog, existingBlog);
    });

    it('/blogs (put) - should update blog', async () => {
      const { blog } = expect.getState();

      const beforeUpdate = await blogTestManager.getBlogById(blog.id);
      blogTestManager.assertBlogsMatch(
        beforeUpdate.blog.name,
        'Marcus Aurelius'
      );

      const createOtherValidInputData = blogTestManager.createInputData({
        name: 'Zeno',
      });

      const response = await blogTestManager.updateBlog(
        createOtherValidInputData,
        blog.id
      );

      const afterUpdate = await blogTestManager.getBlogById(blog.id);

      blogTestManager.assertBlogsMatch(afterUpdate.blog.name, 'Zeno');
    });
  });

  describe('testing delete blog (Delete)', () => {
    afterAll(async () => {
      await cleanDatabase(app);
    });

    it('/blogs/:blogId (DELETE) - should not remove blog without auth', async () => {
      const correctInputData = blogTestManager.createInputData({});
      const blogToDelete = await blogTestManager.createBlog(correctInputData);

      await basicAuthManager.testDeleteAuthorization('blogs', blogToDelete.id);

      expect.setState({ blogToDelete });
    });

    it("/blogs/:blogId (DELETE) - shouldn't remove blog with incorrectId", async () => {
      const { blogToDelete } = expect.getState();
      const invalidBlog = { ...blogToDelete, id: blogToDelete.id.slice(-3) };

      await basicAuthManager.testDeleteAuthorization('blogs', invalidBlog.id);

      expect.setState({ blogToDelete });
    });

    it('/blogs/:blogId (DELETE) - should remove blog and return not found', async () => {
      const { blogToDelete } = expect.getState();

      await blogTestManager.deleteBlog(blogToDelete.id);
    });
  });

  describe(`testing create post by blogId (POST)`, () => {
    afterAll(async () => {
      await cleanDatabase(app);
    });

    beforeAll(async () => {
      const correctInputData = blogTestManager.createInputData({});

      const blogPost = await blogTestManager.createBlog(correctInputData);

      const expectLength = 1;

      blogTestManager.expectLength(expectLength);

      expect.setState({ blogPost, correctInputData });
    });

    it.skip(`/blogs/:blogId/posts (POST) - shouldn't create post without basic auth`, async () => {
      const { blogPost } = expect.getState();

      await basicAuthManager.testPostAuthorization(
        'blogs',
        blogPost.id,
        'posts'
      );
    });

    it.skip(`/blogs/:blogId/posts (POST) - shouldn't create post with invalid title`, async () => {
      const { blogPost } = expect.getState();

      const shortTitle = '01';
      const incorrectInputData = blogTestManager.createPostInputData({
        title: shortTitle,
      });

      const result = await blogTestManager.createPost(
        incorrectInputData,
        blogPost,
        HttpStatus.BAD_REQUEST
      );

      const error = createExceptions(['title']);

      blogTestManager.assertBlogsMatch(result, error);
    });

    it.skip(`/blogs/:blogId/posts (POST) - shouldn't create post with invalid description`, async () => {
      const { blogPost } = expect.getState();

      const incorrectShortDescription = '01';
      const incorrectInputData = blogTestManager.createPostInputData({
        shortDescription: incorrectShortDescription,
      });

      const result = await blogTestManager.createPost(
        incorrectInputData,
        blogPost,
        HttpStatus.BAD_REQUEST
      );

      const error = createExceptions(['shortDescription']);

      blogTestManager.assertBlogsMatch(result, error);
    });

    it.skip(`/blogs/:blogId/posts (POST) - shouldn't create post with invalid content`, async () => {
      const { blogPost } = expect.getState();

      const shortContent = '01';
      const incorrectInputData = blogTestManager.createPostInputData({
        content: shortContent,
      });

      const result = await blogTestManager.createPost(
        incorrectInputData,
        blogPost,
        HttpStatus.BAD_REQUEST
      );

      const error = createExceptions(['content']);

      blogTestManager.assertBlogsMatch(result, error);
    });

    it.skip(`/blogs/:blogId/posts (POST) - shouldn't create post with all incorrect fields, testing error's messages`, async () => {
      const { blogPost } = expect.getState();

      const incorrectInputData = blogTestManager.createPostInputData();

      const result = await blogTestManager.createPost(
        incorrectInputData,
        blogPost,
        HttpStatus.BAD_REQUEST
      );

      const errors = createExceptions(['title', 'shortDescription', 'content']);

      blogTestManager.assertBlogsMatch(result, errors);
    });

    it.skip(`/blogs/:blogId/posts (POST) - should create post for blog`, async () => {
      const { blogPost } = expect.getState();

      const inputCreatePostData = blogTestManager.createPostInputData({});

      const newestPost = await blogTestManager.createPost(
        inputCreatePostData,
        blogPost
      );
    });

    it.skip(`/blogs/:blogId/posts (GET) - should return one post`, async () => {
      const { blogPost } = expect.getState();
      const myStatusWithoutToken = 'None';
      await blogTestManager.getPostsByBlogId(
        blogPost.id,
        null,
        myStatusWithoutToken
      );
    });
  });
});
