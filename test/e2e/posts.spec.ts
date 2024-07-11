import { HttpServer, HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { LikesStatuses } from '../../src/domain/reaction.models';
import { BlogViewModelType } from '../../src/features/blogs/api/controllers';
import { constants, feedbacksConstants } from '../tools/helpers/constants';
import { AuthManager } from '../tools/managers/AuthManager';
import {
  BloggerBlogsTestManager,
  BlogTestManager,
} from '../tools/managers/BlogsTestManager';
import { FeedbacksTestManager } from '../tools/managers/FeedbacksTestManager';
import { PostsTestManager } from '../tools/managers/PostsTestManager';
import { SATestManager } from '../tools/managers/SATestManager';
import { UsersTestManager } from '../tools/managers/UsersTestManager';
import { ApiRouting } from '../tools/routes/api.routing';
import { aDescribe } from '../tools/utils/aDescribe';
import { initSettings } from '../tools/utils/initSettings';
import { skipSettings } from '../tools/utils/testsSettings';
import { RouterPaths } from '../tools/helpers/routing';

// (only, skip)
aDescribe(skipSettings.for('posts'))('PostsController (e2e)', () => {
  let app: INestApplication;
  let testingAppModule: TestingModule;
  let postTestManager: PostsTestManager;
  let authManager: AuthManager;
  let bloggerTestManager: BloggerBlogsTestManager;
  let saManager: SATestManager;
  let feedbacksTestManager: FeedbacksTestManager;
  let usersTestManager: UsersTestManager;
  let httpServer: HttpServer;
  let apiRouting: ApiRouting;

  beforeAll(async () => {
    const settings = await initSettings();

    httpServer = settings.httpServer;
    app = settings.app;
    postTestManager = new PostsTestManager(app);
    apiRouting = new ApiRouting();

    const { createTestManager } = new BlogTestManager(app);
    bloggerTestManager = createTestManager(
      RouterPaths.blogger,
    ) as BloggerBlogsTestManager;

    authManager = new AuthManager(app);
    saManager = new SATestManager(app);
    feedbacksTestManager = new FeedbacksTestManager(app);
    usersTestManager = settings.usersTestManager;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST posts/:postId/comments', () => {
    afterAll(async () => {
      // await cleanDatabase(httpsServer);
    });

    beforeAll(async () => {
      const blogInputData = bloggerTestManager.createInputData({});
      const blog = await bloggerTestManager.createBlog(blogInputData, 'token');

      const userInputData = saManager.createInputData({});

      const { user: user1 } = await saManager.createSA(userInputData);

      const user1AfterLogin = await authManager.login(userInputData);

      const userAnotherData = saManager.createInputData({
        login: 'login',
        email: 'email@test.test',
      });

      const { user: user2 } = await saManager.createSA(userAnotherData);

      const user2AfterLogin = await authManager.login(userAnotherData);

      const inputPostData = bloggerTestManager.createPostInputData({});

      // const post = await bloggerTestManager.createPost(inputPostData, blog);

      // expect.setState({
      //   post,
      //   user1,
      //   user2,
      //   accessToken1: user1AfterLogin.accessToken,
      //   accessToken2: user2AfterLogin.accessToken,
      // });
    });

    it("/posts/:postId/comments (POST) - shouldn't create comment with invalid token, expect UNAUTHORIZED", async () => {
      const { post, user1 } = expect.getState();

      await feedbacksTestManager.createComment(
        { user: user1, token: constants.inputData.expiredAccessToken, post },
        feedbacksConstants.createdContent[0],
        HttpStatus.UNAUTHORIZED,
      );
    });

    it("/posts/:postId/comments (POST) - shouldn't create comment with invalid postId, expect NOT_FOUND", async () => {
      const { post, accessToken1, user1 } = expect.getState();

      const postWithInvalidPostId = { ...post, id: post.id.slice(-3) };

      await feedbacksTestManager.createComment(
        { user: user1, token: accessToken1, post: postWithInvalidPostId },
        feedbacksConstants.createdContent[0],
        HttpStatus.NOT_FOUND,
      );
    });

    it("/posts/:postId/comments (POST) - shouldn't create comment with invalid body message (content), expect BAD_REQUEST", async () => {
      const { post, accessToken1, user1 } = expect.getState();

      const content = '';

      await feedbacksTestManager.createComment(
        { user: user1, token: accessToken1, post },
        content,
        HttpStatus.BAD_REQUEST,
      );
    });

    it('/posts/:postId/comments (POST) - should create comment by user2 the same post, expect CREATED', async () => {
      const { post, accessToken2, user2 } = expect.getState();

      await feedbacksTestManager.createComment(
        { user: user2, token: accessToken2, post },
        feedbacksConstants.createdContent[0],
      );
    });

    it('/posts/:postId/comments (POST) - should create comments by user1 the same post, expect CREATED', async () => {
      const { post, accessToken1, user1 } = expect.getState();

      for (let i = 0; i < 5; i++) {
        let content = feedbacksConstants.createdContent[i];
        await feedbacksTestManager.createComment(
          { user: user1, token: accessToken1, post },
          content,
        );
      }
    });

    it('/posts/:postId/comments (GET) - should receive 5 comments for current post, expect CREATED', async () => {
      const { post, accessToken1, user1 } = expect.getState();
    });
  });

  describe('userReactions / postLikeStatuses', () => {
    // afterAll(async () => {
    //   await cleanDatabase(app);
    // });

    beforeAll(async () => {
      const numberOfUsers = 5;
      const numberOfPosts = 3;

      const { users, accessTokens } = await usersTestManager.createUsers(
        numberOfUsers,
      );

      const inputBlogData = bloggerTestManager.createInputData({});
      // const blog = await bloggerTestManager.createBlog(inputBlogData, 'token');

      // const posts = await bloggerTestManager.createPosts(blog, accessTokens[0], numberOfPosts);

      // expect.setState({ posts, users, accessTokens });
    });

    it('/posts/:postId/like-status (PUT) - create a likes for each post, expect 204', async () => {
      const { posts, accessTokens } = expect.getState();

      await postTestManager.likeStatusOperations(
        posts,
        accessTokens[0],
        LikesStatuses.Like,
      );

      await postTestManager.likeStatusOperations(
        posts,
        accessTokens[1],
        LikesStatuses.Like,
      );

      await postTestManager.likeStatusOperations(
        posts,
        accessTokens[2],
        LikesStatuses.Like,
      );

      await postTestManager.likeStatusOperations(
        posts,
        accessTokens[3],
        LikesStatuses.Like,
      );

      await postTestManager.likeStatusOperations(
        posts,
        accessTokens[4],
        LikesStatuses.Dislike,
      );

      const post = await postTestManager.getPostById(posts[0].id);

      const numberOfLikes = 4;

      postTestManager.checkPostData(
        post.extendedLikesInfo.likesCount,
        numberOfLikes,
      );
    });

    it('/posts/:postId/like-status (PUT) - change like status to dislike', async () => {
      const { posts, accessTokens } = expect.getState();

      await postTestManager.likeStatusOperations(
        posts,
        accessTokens[0],
        LikesStatuses.Dislike,
      );

      await postTestManager.getPostById(
        posts[0].id,
        accessTokens[0],
        LikesStatuses.Dislike,
      );
    });
  });
});
