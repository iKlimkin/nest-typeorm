import { HttpServer, HttpStatus, INestApplication } from '@nestjs/common';
import { configureTestSetup } from '../tools/fixtures/setup-environment';
import { constants } from '../tools/helpers/constants';
import { RouterPaths } from '../../src/infra/utils/routing';
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
import { e2eTestNamesEnum, skipSettings } from '../tools/utils/testsSettings';
import { PostsTestManager } from '../tools/managers/PostsTestManager';
import { SATestManager } from '../tools/managers/SATestManager';
import { BlogViewModelType } from '../../src/features/blogs/api/models/output.blog.models/blog.view.model-type';
import { LikesStatuses } from '../../src/domain/reaction.models';
import { SortDirections } from '../../src/domain/sorting-base-filter';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';

aDescribe(skipSettings.for(e2eTestNamesEnum.bloggerBlogs))(
  'BloggerController (e2e)',
  () => {
    let app: INestApplication;
    let bloggerTestManager: BloggerBlogsTestManager;
    let usersTestManager: UsersTestManager;
    let httpServer: HttpServer;
    let paginationModel: PaginationModel<BlogViewModelType>;
    let publicBlogsTestManager: PublicBlogsTestManager;
    let postsTestManager: PostsTestManager;
    let saTestManager: SATestManager;

    beforeAll(async () => {
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
      postsTestManager = new PostsTestManager(app, settings.apiRouting.posts);
      saTestManager = new SATestManager(app, settings.apiRouting.SAUsers);
      paginationModel = new PaginationModel();
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
        bloggerTestManager.assertMatch(res1, error);

        const inputDataOverLenName = bloggerTestManager.createInputData({
          name: constants.inputData.length16,
        });

        const res2 = await bloggerTestManager.createBlog(
          inputDataOverLenName,
          firstPlayerToken,
          HttpStatus.BAD_REQUEST,
        );

        const error2 = createExceptions(['name']);
        bloggerTestManager.assertMatch(res2, error2);
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
        bloggerTestManager.assertMatch(res1, error);

        const longDescription = bloggerTestManager.createInputData({
          description: constants.inputData.length501,
        });

        const res2 = await bloggerTestManager.createBlog(
          longDescription,
          firstPlayerToken,
          HttpStatus.BAD_REQUEST,
        );

        const error2 = createExceptions(['description']);
        bloggerTestManager.assertMatch(res2, error2);
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
        bloggerTestManager.assertMatch(res1, error);

        const longWebsiteUrl = bloggerTestManager.createInputData({
          websiteUrl: constants.inputData.length101,
        });

        const res2 = await bloggerTestManager.createBlog(
          longWebsiteUrl,
          firstPlayerToken,
          HttpStatus.BAD_REQUEST,
        );

        const error2 = createExceptions(['websiteUrl']);
        bloggerTestManager.assertMatch(res2, error2);

        const doesNotMatchUrl = bloggerTestManager.createInputData({
          websiteUrl: 'websiteUrl',
        });

        const res3 = await bloggerTestManager.createBlog(
          doesNotMatchUrl,
          firstPlayerToken,
          HttpStatus.BAD_REQUEST,
        );

        const error3 = createExceptions(['websiteUrl']);
        bloggerTestManager.assertMatch(res3, error3);
      });

      it("/blogger/blogs (POST) - shouldn't create blog with empty body ", async () => {
        const { firstPlayerToken } = expect.getState();

        const inputData = bloggerTestManager.createInputData();

        const newBlog = await bloggerTestManager.createBlog(
          inputData,
          firstPlayerToken,
          HttpStatus.BAD_REQUEST,
        );

        bloggerTestManager.assertMatch(newBlog, blogValidationErrors);
      });

      it('/blogger/blogs (post) - should create blog', async () => {
        const { firstPlayerToken } = expect.getState();
        const inputData = bloggerTestManager.createInputData({});
        const blog = await bloggerTestManager.createBlog(
          inputData,
          firstPlayerToken,
        );

        bloggerTestManager.assertMatch(blog, blogEqualTo);

        const expectLength = 1;
        const blogsResponse = await bloggerTestManager.getBloggerBlogs(
          firstPlayerToken,
        );
        expect(blogsResponse.items.length).toBe(expectLength);
        expect(blogsResponse.totalCount).toBe(expectLength);
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
        const { firstPlayerToken, secondPlayerToken, blogId } =
          expect.getState();
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
          null,
          HttpStatus.NOT_FOUND,
        );
      });
    });

    describe('testing get blogs (GET -> "blogger/blogs")', () => {
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
        // bloggerTestManager.assertMatch(blogs, expectLength);
      });

      it('/blogger/blogs (GET) - should return blogs with pagination', async () => {
        const { firstPlayerToken } = expect.getState();

        // const blogs = await publicBlogsTestManager.getPublicBlogs(
        //   firstPlayerToken,
        //   paginationModel,
        // );
        // const expectLength = 1;
        // bloggerTestManager.assertMatch(blogs, expectLength);
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

        bloggerTestManager.assertMatch(result1, error);
        bloggerTestManager.assertMatch(result2, error);
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

        bloggerTestManager.assertMatch(result, error);
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

        bloggerTestManager.assertMatch(result1, error);
        bloggerTestManager.assertMatch(result2, error);
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

        const errors = createExceptions([
          'title',
          'shortDescription',
          'content',
        ]);

        bloggerTestManager.assertMatch(result, errors);
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
        const postsResponse = await bloggerTestManager.getBloggerPosts(
          blogByFirstToken.id,
          firstPlayerToken,
        );
        expect(postsResponse.items.length).toBe(expectAmountOfPosts);
        expect(postsResponse.totalCount).toBe(expectAmountOfPosts);
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
          { users: { quantity: 10 }, posts: { quantity: 10 } },
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
      it('should receive blogger posts', async () => {
        const { firstPlayerToken, blogByFirstToken } = expect.getState();

        await bloggerTestManager.getBloggerPosts(
          blogByFirstToken.id,
          firstPlayerToken,
        );
      });
      it.skip('test before test get user reaction (<=_=>)', async () => {
        const {
          postByFirstToken,
          postBySecondToken,
          accessTokens,
          firstPlayerToken,
          users,
        } = expect.getState();

        await postsTestManager.likeStatusOperations(
          postByFirstToken.id,
          firstPlayerToken,
          LikesStatuses.Dislike,
        );

        await postsTestManager.likeStatusOperations(
          postByFirstToken.id,
          firstPlayerToken,
          LikesStatuses.Like,
        );
      });
      it('testing get posts, with ban user logic', async () => {
        const {
          postByFirstToken,
          postBySecondToken,
          accessTokens,
          firstPlayerToken,
          secondPlayerToken,
          posts,
          users,
        } = expect.getState();
        // get posts of the same blog
        const [firstPost, secondPost] = posts.filter(
          (post) => postByFirstToken.blogId === post.blogId,
        );

        // five likes and dislikes
        for (let i = 0; i < 10; i++) {
          await postsTestManager.likeStatusOperations(
            firstPost.id,
            accessTokens[i],
            i % 2 ? LikesStatuses.Like : LikesStatuses.Dislike,
          );

          await postsTestManager.likeStatusOperations(
            secondPost.id,
            accessTokens[i],
            i % 2 ? LikesStatuses.Dislike : LikesStatuses.Like,
          );
        }
        const { items: bloggerPosts } =
          await bloggerTestManager.getBloggerPosts(
            firstPost.blogId,
            firstPlayerToken,
          );

        const analyzedFirstPost = bloggerPosts.find(
          (post) => post.id === firstPost.id,
        );
        const analyzedSecondPost = bloggerPosts.find(
          (post) => post.id === secondPost.id,
        );

        expect(
          analyzedFirstPost.extendedLikesInfo.likesCount &&
            analyzedFirstPost.extendedLikesInfo.dislikesCount,
        ).toBe(5);
        expect(analyzedFirstPost.extendedLikesInfo.myStatus).toBe(
          LikesStatuses.Dislike,
        );
        expect(
          analyzedSecondPost.extendedLikesInfo.likesCount &&
            analyzedSecondPost.extendedLikesInfo.dislikesCount,
        ).toBe(5);
        expect(analyzedSecondPost.extendedLikesInfo.myStatus).toBe(
          LikesStatuses.Like,
        );

        // posts after ban firstUser who created 1 post and gave dis to firstPost and like to secondPost
        const banReason = saTestManager.createBanRestriction({
          isBanned: true,
        });
        await saTestManager.banUser(users[0].id, banReason);
        // after ban user cannot use his token
        await bloggerTestManager.getBloggerPosts(
          firstPost.blogId,
          firstPlayerToken,
          HttpStatus.UNAUTHORIZED,
        );
        // FORBIDDEN because firstUser is a blog creator
        await bloggerTestManager.getBloggerPosts(
          firstPost.blogId,
          secondPlayerToken,
          HttpStatus.FORBIDDEN,
        );

        const unbanReason = saTestManager.createBanRestriction({
          isBanned: false,
        });
        await saTestManager.banUser(users[0].id, unbanReason);
        // after ban you should login in system
        const { accessToken: userTokenAfterUnban } =
          await usersTestManager.authLogin(users[0]);
        const { items: bloggerPostsAfterUnban } =
          await bloggerTestManager.getBloggerPosts(
            firstPost.blogId,
            userTokenAfterUnban,
          );
        const {
          extendedLikesInfo: {
            likesCount: likesFirstPost,
            dislikesCount: disFirstPost,
            myStatus: myStatusFirstPostAfter,
          },
        } = bloggerPosts.find((post) => post.id === firstPost.id);
        const {
          extendedLikesInfo: {
            likesCount: likesSecondPost,
            dislikesCount: disSecondPost,
            myStatus: myStatusSecondPostAfter,
          },
        } = bloggerPosts.find((post) => post.id === secondPost.id);
        // should receive the same quantity of post's likes as before ban
        expect(
          analyzedFirstPost.extendedLikesInfo.likesCount &&
            analyzedFirstPost.extendedLikesInfo.dislikesCount,
        ).toBe(likesFirstPost && disFirstPost);
        expect(analyzedFirstPost.extendedLikesInfo.myStatus).toBe(
          myStatusFirstPostAfter,
        );
        expect(
          analyzedSecondPost.extendedLikesInfo.likesCount &&
            analyzedSecondPost.extendedLikesInfo.dislikesCount,
        ).toBe(likesSecondPost && disSecondPost);
        expect(analyzedSecondPost.extendedLikesInfo.myStatus).toBe(
          myStatusSecondPostAfter,
        );
        // add ban other user who is not a blog creator!
        // totalCount -1 reactions -1
        // expect(totalCount).toBe()
      });

      it(`testing get post's reactions with banned user`, async () => {
        const {
          postByFirstToken,
          postBySecondToken,
          accessTokens,
          firstPlayerToken,
          secondPlayerToken,
          posts,
          users,
        } = expect.getState();
        const analyzedBlogId = postBySecondToken.blogId;
        const [firstPost, secondPost] = posts.filter(
          (post) => analyzedBlogId === post.blogId,
        );

        const intendedUser = users[5];
        const targetUserToken = accessTokens[5];

        const targetUserInfo = await usersTestManager.me(
          intendedUser,
          targetUserToken,
        );

        const { items: postsBeforeReactions } =
          await bloggerTestManager.getBloggerPosts(
            analyzedBlogId,
            secondPlayerToken,
          );

        postsBeforeReactions.forEach((post) => {
          expect(post.extendedLikesInfo.myStatus).toBe(LikesStatuses.None);
          expect(
            post.extendedLikesInfo.likesCount &&
              post.extendedLikesInfo.dislikesCount,
          ).toBe(0);
        });

        console.log({ firstPost, secondPlayerToken });

        // gave four likes firstPost
        await postsTestManager.likeStatusOperations(
          firstPost.id,
          targetUserToken,
          LikesStatuses.Like,
        );
        await postsTestManager.likeStatusOperations(
          firstPost.id,
          secondPlayerToken,
          LikesStatuses.Like,
        );
        await postsTestManager.likeStatusOperations(
          firstPost.id,
          accessTokens[2],
          LikesStatuses.Like,
        );
        await postsTestManager.likeStatusOperations(
          firstPost.id,
          accessTokens[3],
          LikesStatuses.Like,
        );

        const { items: postsAfterLikesFirstPost } =
          await bloggerTestManager.getBloggerPosts(
            analyzedBlogId,
            secondPlayerToken,
          );

        postsAfterLikesFirstPost.forEach((post) => {
          if (post.id === firstPost.id) {
            const {
              extendedLikesInfo: {
                myStatus,
                newestLikes,
                dislikesCount,
                likesCount,
              },
            } = post;
            expect(myStatus).toBe(LikesStatuses.Like);
            expect(likesCount).toBe(4);
            expect(newestLikes.length).toBeLessThanOrEqual(3);
            expect(dislikesCount).toBe(0);
            bloggerTestManager.isSortedByField({
              entities: newestLikes,
              field: 'addedAt',
              sortDirection: SortDirections.DESC,
            });
            expect(newestLikes).toEqual(
              expect.arrayContaining([
                expect.objectContaining({
                  userId: expect.any(String),
                  addedAt: expect.any(String),
                  login: expect.any(String),
                }),
              ]),
            );
          }
        });

        // gave 2 dis secondPost
        await postsTestManager.likeStatusOperations(
          secondPost.id,
          secondPlayerToken,
          LikesStatuses.Dislike,
        );

        await postsTestManager.likeStatusOperations(
          secondPost.id,
          targetUserToken,
          LikesStatuses.Dislike,
        );

        // banned target user that gave like firstPost and dis secondPost.
        await saTestManager.banUser(
          targetUserInfo.userId,
          saTestManager.createBanRestriction({ isBanned: true }),
        );

        const { items: postsReactionsAfterBanTargetUser } =
          await bloggerTestManager.getBloggerPosts(
            analyzedBlogId,
            secondPlayerToken,
          );

        const firstPostAfterBan = postsReactionsAfterBanTargetUser.find(
          (p) => p.id === firstPost.id,
        );
        console.log({ firstPostAfterBan, firstPost });

        expect(firstPostAfterBan.extendedLikesInfo.likesCount).toBe(3);
        const secondPostAfterBan = postsReactionsAfterBanTargetUser.find(
          (p) => p.id === secondPost.id,
        );
        expect(secondPostAfterBan.extendedLikesInfo.dislikesCount).toBe(1);

        await saTestManager.banUser(
          targetUserInfo.userId,
          saTestManager.createBanRestriction({ isBanned: false }),
        );

        const { items: postsReactionsAfterUnbanTargetUser } =
          await bloggerTestManager.getBloggerPosts(
            analyzedBlogId,
            secondPlayerToken,
          );

        const {
          extendedLikesInfo: {
            likesCount: likesSecondPost,
            dislikesCount: disSecondPost,
          },
        } = postsReactionsAfterUnbanTargetUser.find(
          (p) => p.id === secondPost.id,
        );
        expect(likesSecondPost).toBe(0);
        expect(disSecondPost).toBe(2);

        const {
          extendedLikesInfo: { likesCount, dislikesCount },
        } = postsReactionsAfterUnbanTargetUser.find(
          (p) => p.id === firstPost.id,
        );
        expect(likesCount).toBe(4);
        expect(dislikesCount).toBe(0);
      });

      it('should receive correct info after unban', async () => {});
    });

    describe('testing get all comments for current user', () => {
      afterAll(async () => {
        await cleanDatabase(httpServer);
      });
      beforeAll(async () => {
        await configureTestSetup(
          () => ({
            usersTestManager,
            bloggerTestManager,
            postsTestManager,
          }),
          { comments: { quantity: 10 } },
        );
      });

      it('get all comments', async () => {
        const { firstPlayerToken } = expect.getState();

        const { items: comments } =
          await bloggerTestManager.getAllCommentsForUserBlogs(firstPlayerToken);

        bloggerTestManager.isSortedByField({
          entities: comments,
          field: 'createdAt',
          sortDirection: SortDirections.DESC,
        });

        const { items: commentsByContent } =
          await bloggerTestManager.getAllCommentsForUserBlogs(
            firstPlayerToken,
            {
              sortBy: 'content',
              sortDirection: SortDirections.ASC,
            },
          );

        bloggerTestManager.isSortedByField({
          entities: commentsByContent,
          field: 'content',
          sortDirection: SortDirections.ASC,
        });
      });
    });

    describe(`upload files`, () => {
      afterAll(async () => {
        // await cleanDatabase(httpServer);
      });
      beforeAll(async () => {
        await configureTestSetup(
          () => ({
            usersTestManager,
            bloggerTestManager,
            postsTestManager,
          }),
          { blogs: { quantity: 2 }, comments: { quantity: 10 } },
        );
      });

      it(`should upload wallpaper for blog`, async () => {
        const { firstPlayerToken, postByFirstToken } = expect.getState();

        const resizedImageBuffer = await bloggerTestManager.prepareFileToSend(
          'size-52kb',
          {
            width: 1028,
            height: 312,
          },
        );

        await bloggerTestManager.uploadBackWallForBlog({
          accessToken: firstPlayerToken,
          blogId: postByFirstToken.blogId,
          fileBuffer: resizedImageBuffer,
        });
      });
      it(`should upload main image for blog`, async () => {
        const { firstPlayerToken, postByFirstToken } = expect.getState();

        const filePaths = [
          '../../../images/size-87kb.jpg',
          '../../../images/size-52kb.png',
          '../../../images/size-87kb.jpeg',
        ];

        for (const filePath of filePaths) {
          const fileBuffer = readFileSync(resolve(__dirname, filePath));
          const resizedImageBuffer = await bloggerTestManager.resizeImg(
            fileBuffer,
            156,
            156,
          );
          await bloggerTestManager.uploadBlogMainImage({
            accessToken: firstPlayerToken,
            blogId: postByFirstToken.blogId,
            fileBuffer: resizedImageBuffer,
          });
        }
        for (const filePath of filePaths) {
          const fileBuffer = readFileSync(resolve(__dirname, filePath));
          const resizedImageBuffer = await bloggerTestManager.resizeImg(
            fileBuffer,
            156,
            156,
          );
          await bloggerTestManager.uploadBlogMainImage({
            accessToken: firstPlayerToken,
            blogId: postByFirstToken.blogId,
            fileBuffer: resizedImageBuffer,
          });
        }

        const blogsResponse = await bloggerTestManager.getBloggerBlogs(
          firstPlayerToken,
        );

        const bloggerPostsResponse = await bloggerTestManager.getBloggerPosts(
          postByFirstToken.blogId,
          firstPlayerToken,
        );
      });
      it(`should upload main image for post`, async () => {
        const {
          firstPlayerToken,
          postByFirstToken,
          postBySecondToken,
          secondPlayerToken,
        } = expect.getState();

        const fileNames = ['size-87kb.jpg', 'size-52kb.png', 'size-87kb.jpeg'];

        for (const fileName of fileNames) {
          const resizedMainImageBuffer =
            await bloggerTestManager.prepareFileToSend(fileName, {
              width: 940,
              height: 432,
            });

          await bloggerTestManager.uploadPostMainImage({
            accessToken: firstPlayerToken,
            blogId: postByFirstToken.blogId,
            fileBuffer: resizedMainImageBuffer,
            postId: postByFirstToken.id,
            fileName: fileName.split('.').shift(),
          });
        }

        const resizedMainImageBuffer =
          await bloggerTestManager.prepareFileToSend(fileNames[0], {
            width: 940,
            height: 432,
          });
        await bloggerTestManager.uploadPostMainImage({
          accessToken: firstPlayerToken,
          blogId: postByFirstToken.blogId,
          fileBuffer: resizedMainImageBuffer,
          postId: constants.inputData.validUUID,
          fileName: fileNames[0].split('.').shift(),
          expectedStatus: HttpStatus.NOT_FOUND,
        });

        await bloggerTestManager.uploadPostMainImage({
          accessToken: firstPlayerToken,
          blogId: constants.inputData.validUUID,
          fileBuffer: resizedMainImageBuffer,
          postId: postByFirstToken.id,
          fileName: fileNames[0].split('.').shift(),
          expectedStatus: HttpStatus.NOT_FOUND,
        });

        // upload main photo for secondPost
        const resizedMainImageSecondPostBuffer =
          await bloggerTestManager.prepareFileToSend(fileNames[0], {
            width: 940,
            height: 432,
          });

        await bloggerTestManager.uploadPostMainImage({
          accessToken: secondPlayerToken,
          blogId: postBySecondToken.blogId,
          fileBuffer: resizedMainImageSecondPostBuffer,
          postId: postBySecondToken.id,
          fileName: 'mainPhotoSecondPost',
        });

        const postsFirstBlogAfterUploadedMainImages =
          await bloggerTestManager.getBloggerPosts(
            postByFirstToken.blogId,
            firstPlayerToken,
          );

        const firstPost = postsFirstBlogAfterUploadedMainImages.items.find(
          (p) => p.id === postByFirstToken.id,
        );

        const postsSecondBlogAfterUploadedMainImages =
          await bloggerTestManager.getBloggerPosts(
            postBySecondToken.blogId,
            secondPlayerToken,
          );

        expect(firstPost.images.main).toHaveLength(fileNames.length * 3);

        const secondPost = postsSecondBlogAfterUploadedMainImages.items.find(
          (p) => p.id === postBySecondToken.id,
        );

        expect(secondPost.images.main).toHaveLength(3);

        const post = await postsTestManager.getPostById(
          postByFirstToken.id,
          firstPlayerToken,
        );
        expect(post.images.main).toHaveLength(fileNames.length * 3);
      });
    });
  },
);

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

      bloggerTestManager.assertMatch(
        dataBaseBlogsData,
        mockPaginationBlogsData,
      );
    });
  });
 */
