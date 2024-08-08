import { HttpServer, HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { LikesStatuses } from '../../src/domain/reaction.models';
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
import { e2eTestNamesEnum, skipSettings } from '../tools/utils/testsSettings';
import { RouterPaths } from '../tools/helpers/routing';
import { cleanDatabase } from '../tools/utils/dataBaseCleanup';
import { configureTestSetup } from '../tools/fixtures/setup-environment';
import { createExceptions } from '../tools/utils/exceptionHandlers';
import { commentStructureConsistency } from '../tools/helpers/structure-validation.helpers';

aDescribe(skipSettings.for(e2eTestNamesEnum.posts))(
  'PostsController (e2e)',
  () => {
    let app: INestApplication;
    let testingAppModule: TestingModule;
    let postsTestManager: PostsTestManager;
    let authManager: AuthManager;
    let bloggerTestManager: BloggerBlogsTestManager;
    let saManager: SATestManager;
    let feedbacksTestManager: FeedbacksTestManager;
    let usersTestManager: UsersTestManager;
    let httpServer: HttpServer;
    let apiRouting: ApiRouting;

    beforeAll(async () => {
      const settings = await initSettings();
      apiRouting = settings.apiRouting;
      httpServer = settings.httpServer;
      app = settings.app;

      const { createTestManager } = new BlogTestManager(app);
      const managerCreator = createTestManager.bind(new BlogTestManager(app));
      bloggerTestManager = managerCreator(
        RouterPaths.blogger,
      ) as BloggerBlogsTestManager;

      postsTestManager = new PostsTestManager(app, apiRouting.posts);
      authManager = new AuthManager(app);
      saManager = new SATestManager(app, apiRouting.SAUsers);
      feedbacksTestManager = new FeedbacksTestManager(app, apiRouting.comments);
      usersTestManager = settings.usersTestManager;
    });

    afterAll(async () => {
      await app.close();
    });

    describe('testing comments', () => {
      afterAll(async () => {
        await cleanDatabase(httpServer);
      });

      beforeAll(async () => {
        await configureTestSetup(
          () => ({ usersTestManager, bloggerTestManager, postsTestManager }),
          { posts: true, users: { quantity: 10 } },
        );
      });

      it("/posts/:postId/comments (POST) - shouldn't create comment with invalid token, expect 401", async () => {
        const { postByFirstToken, users } = expect.getState();
        const [firstUser] = users;

        await postsTestManager.createComment(
          {
            user: firstUser,
            accessToken: constants.inputData.expiredAccessToken,
            postId: postByFirstToken.id,
            content: feedbacksConstants.createdContent[0],
          },
          HttpStatus.UNAUTHORIZED,
        );
      });

      it("/posts/:postId/comments (POST) - shouldn't create comment with invalid postId, expect NOT_FOUND", async () => {
        const { postByFirstToken, firstPlayerToken, users } = expect.getState();

        const invalidPostId = { ...postByFirstToken, id: 'id' };

        await postsTestManager.createComment(
          {
            user: users[0],
            accessToken: firstPlayerToken,
            postId: invalidPostId,
            content: feedbacksConstants.createdContent[0],
          },

          HttpStatus.NOT_FOUND,
        );
      });

      it("/posts/:postId/comments (POST) - shouldn't create comment with invalid body message (content), expect BAD_REQUEST", async () => {
        const { postByFirstToken, firstPlayerToken, users } = expect.getState();

        const { comment: commentFirst } = await postsTestManager.createComment(
          {
            user: users[0],
            accessToken: firstPlayerToken,
            postId: postByFirstToken.id,
            content: constants.inputData.length16,
          },
          HttpStatus.BAD_REQUEST,
        );

        const firstError = createExceptions(['content']);
        feedbacksTestManager.assertMatch(commentFirst, firstError);

        const { comment: secondComment } = await postsTestManager.createComment(
          {
            user: users[0],
            accessToken: firstPlayerToken,
            postId: postByFirstToken.id,
            content: constants.inputData.length301,
          },
          HttpStatus.BAD_REQUEST,
        );

        const secondError = createExceptions(['content']);
        feedbacksTestManager.assertMatch(secondComment, secondError);
      });

      it('/posts/:postId/comments (POST) - should create comment by first user, expect CREATED', async () => {
        const { postByFirstToken, firstPlayerToken, users } = expect.getState();

        await postsTestManager.createComment({
          user: users[0],
          accessToken: firstPlayerToken,
          postId: postByFirstToken.id,
          content: feedbacksConstants.createdContent[0],
        });
      });

      it('/posts/:postId/comments (POST) - should create 5 comments by second and third users on the same post, expect CREATED', async () => {
        const { postByFirstToken, secondPlayerToken, thirdPlayerToken, users } =
          expect.getState();

        for (let i = 0; i < 5; i++) {
          let content = feedbacksConstants.createdContent[i];
          await postsTestManager.createComment({
            user: users[1],
            accessToken: secondPlayerToken,
            postId: postByFirstToken.id,
            content,
          });
          await postsTestManager.createComment({
            user: users[2],
            accessToken: thirdPlayerToken,
            postId: postByFirstToken.id,
            content: feedbacksConstants.createdContent[4 - i],
          });
        }

        const comments = await postsTestManager.getCommentsForTheCurrentPost(
          postByFirstToken.id,
        );

        expect(comments.items.length && comments.totalCount).toBe(11);
      });

      it('/posts/:postId/comments (GET) - should receive 5 comments for current post, 200', async () => {});

      it('/posts/:postId/comments (GET) after sa/users/:userId/ban (PUT) - should receive comments without comments belonging to the banned user ', async () => {
        const { postByFirstToken, users } = expect.getState();
        const restrictionDataFirstUser = saManager.createBanRestriction({
          isBanned: true,
        });
        await saManager.banUser(users[0].id, restrictionDataFirstUser);
        const commentsAfterBanFirstUser =
          await postsTestManager.getCommentsForTheCurrentPost(
            postByFirstToken.id,
          );
        // comments without banned first user
        expect(
          commentsAfterBanFirstUser.items.length &&
            commentsAfterBanFirstUser.totalCount,
        ).toBe(10);

        const restrictionDataSecondUser = saManager.createBanRestriction({
          isBanned: true,
        });
        await saManager.banUser(users[1].id, restrictionDataSecondUser);
        // comments without banned second user
        const commentsAfterBanSecondUser =
          await postsTestManager.getCommentsForTheCurrentPost(
            postByFirstToken.id,
          );

        expect(
          commentsAfterBanSecondUser.items.length &&
            commentsAfterBanSecondUser.totalCount,
        ).toBe(5);

        await saManager.banUser(
          users[1].id,
          saManager.createBanRestriction({ isBanned: false }),
        );
        const { accessToken: secondUnbannedUserToken } =
          await usersTestManager.authLogin(users[1]);
        // comments with unbanned second user
        const commentsAfterUnbanSecondUser =
          await postsTestManager.getCommentsForTheCurrentPost(
            postByFirstToken.id,
            secondUnbannedUserToken,
          );

        expect(
          commentsAfterUnbanSecondUser.items.length &&
            commentsAfterUnbanSecondUser.totalCount,
        ).toBe(10);
      });
      it(`testing give reactions to comments with ban and unban user, getById, getCommentsByPost`, async () => {
        const { postByFirstToken, users, accessTokens } = expect.getState();

        const [fourthToken, fifthToken, sixthToken, ...restTokens] =
          accessTokens.slice(3);

        const { items: comments } =
          await postsTestManager.getCommentsForTheCurrentPost(
            postByFirstToken.id,
            fourthToken,
          );
        const mainUser = users[6];
        const mainUserToken = restTokens[0];
        const analyzedComment = comments[0];
        expect(analyzedComment).toEqual(commentStructureConsistency());

        for (let i = 0; i < 4; i++) {
          await feedbacksTestManager.likeStatusOperations(
            analyzedComment.id,
            restTokens[i],
            LikesStatuses.Like,
          );
        }
        await usersTestManager.me(mainUser, mainUserToken);
        await feedbacksTestManager.likeStatusOperations(
          analyzedComment.id,
          mainUserToken,
          LikesStatuses.Like,
        );
        const comment = await feedbacksTestManager.getComment(
          analyzedComment.id,
          mainUserToken,
        );

        expect(comment.likesInfo.likesCount).toBe(4);
        expect(comment.likesInfo.myStatus).toBe(LikesStatuses.Like);

        const { items: commentsAfterLikes } =
          await postsTestManager.getCommentsForTheCurrentPost(
            postByFirstToken.id,
            null,
            mainUserToken,
          );

        const commentFromComments = commentsAfterLikes.find(
          (c) => c.id === analyzedComment.id,
        );
        expect(commentFromComments.likesInfo.myStatus).toBe(LikesStatuses.Like);
        expect(commentFromComments).toEqual(comment);

        // ban main user who gave 1 like analyzedComment
        await saManager.banUser(
          mainUser.id,
          saManager.createBanRestriction({ isBanned: true }),
        );
        await usersTestManager.authLogin(
          mainUser,
          null,
          HttpStatus.UNAUTHORIZED,
        );

        const commentAfterBanMainUser = await feedbacksTestManager.getComment(
          analyzedComment.id,
          mainUserToken,
        );

        expect(commentAfterBanMainUser.likesInfo.myStatus).toBe(
          LikesStatuses.None,
        );
      });
      it(`testing create comment and then get by id or find in comments by post, shouldn't receive, because user is banned`, async () => {
        const { postByFirstToken, thirdPlayerToken, users, firstPlayerToken } =
          expect.getState();
        const targetUser = users[2];
        const { comment: newComment } = await postsTestManager.createComment({
          user: targetUser,
          accessToken: thirdPlayerToken,
          postId: postByFirstToken.id,
          content: feedbacksConstants.createdContent[4],
        });
        expect(newComment).toEqual(commentStructureConsistency());
        await saManager.banUser(
          targetUser.id,
          saManager.createBanRestriction({ isBanned: true }),
        );
        await feedbacksTestManager.getComment(
          newComment.id,
          firstPlayerToken,
          HttpStatus.NOT_FOUND,
        );
        await saManager.banUser(
          targetUser.id,
          saManager.createBanRestriction({ isBanned: false }),
        );

        await feedbacksTestManager.getComment(newComment.id, firstPlayerToken);
      });
    });

    describe('testing like-status', () => {
      afterAll(async () => {
        await cleanDatabase(httpServer);
      });

      beforeAll(async () => {
        await configureTestSetup(
          () => ({ usersTestManager, bloggerTestManager }),
          { users: { quantity: 10 }, posts: { quantity: 15 } },
        );
      });

      it('/posts/:postId/like-status (PUT) - change like status to dislike', async () => {
        const { postByFirstToken, firstPlayerToken } = expect.getState();

        await postsTestManager.likeStatusOperations(
          postByFirstToken.id,
          firstPlayerToken,
          LikesStatuses.Dislike,
        );
        const comment = await postsTestManager.getPostById(
          postByFirstToken.id,
          firstPlayerToken,
        );
        expect(comment.extendedLikesInfo.myStatus).toBe(LikesStatuses.Dislike);
      });

      it('/posts/:postId/like-status (PUT) - create five likes and dislikes for each of two posts, expect 204', async () => {
        const {
          postByFirstToken,
          postBySecondToken,
          accessTokens,
          firstPlayerToken,
        } = expect.getState();

        // five likes and dislikes
        for (let i = 0; i < 10; i++) {
          await postsTestManager.likeStatusOperations(
            postByFirstToken.id,
            accessTokens[i],
            i % 2 ? LikesStatuses.Like : LikesStatuses.Dislike,
          );

          await postsTestManager.likeStatusOperations(
            postBySecondToken.id,
            accessTokens[i],
            i % 2 ? LikesStatuses.Dislike : LikesStatuses.Like,
          );
        }
        const amountOfEachReaction = 5;

        const firstPost = await postsTestManager.getPostById(
          postByFirstToken.id,
          firstPlayerToken,
        );

        expect(firstPost.extendedLikesInfo.myStatus).toBe(
          LikesStatuses.Dislike,
        );
        expect(
          firstPost.extendedLikesInfo.likesCount &&
            firstPost.extendedLikesInfo.dislikesCount,
        ).toBe(amountOfEachReaction);

        const secondPost = await postsTestManager.getPostById(
          postBySecondToken.id,
          accessTokens[1],
        );

        expect(secondPost.extendedLikesInfo.myStatus).toBe(
          LikesStatuses.Dislike,
        );
        expect(
          secondPost.extendedLikesInfo.likesCount &&
            secondPost.extendedLikesInfo.dislikesCount,
        ).toBe(amountOfEachReaction);
      });

      it.skip('/posts/:postId/like-status (PUT) - change like status to dislike', async () => {
        const { posts, accessTokens } = expect.getState();

        await postsTestManager.likeStatusOperations(
          posts,
          accessTokens[0],
          LikesStatuses.Dislike,
        );

        await postsTestManager.getPostById(posts[0].id, accessTokens[0]);
      });
    });

    describe('testing get post(s) with user ban logic', () => {
      afterAll(async () => {
        await cleanDatabase(httpServer);
      });

      beforeAll(async () => {
        await configureTestSetup(
          () => ({ usersTestManager, bloggerTestManager }),
          { posts: true },
        );
      });

      it('/posts (GET) - should return post, ban logic', async () => {
        const { firstPlayerToken, postByFirstToken, secondPlayerToken, users } =
          expect.getState();

        // give like by second player
        await postsTestManager.likeStatusOperations(
          postByFirstToken.id,
          secondPlayerToken,
          LikesStatuses.Like,
        );

        const post = await postsTestManager.getPostById(
          postByFirstToken.id,
          secondPlayerToken,
        );

        const postBefore = (
          await postsTestManager.getPosts(secondPlayerToken)
        ).items.find((p) => p.id === post.id);

        expect(postBefore.extendedLikesInfo.myStatus).toEqual(
          LikesStatuses.Like,
        );
        expect(postBefore.extendedLikesInfo.likesCount).toEqual(1);

        expect(post.extendedLikesInfo.likesCount).toBe(1);
        expect(post.extendedLikesInfo.myStatus).toBe(LikesStatuses.Like);

        await saManager.banUser(
          users[1].id,
          saManager.createBanRestriction({ isBanned: true }),
        );

        const postAfter = (await postsTestManager.getPosts()).items.find(
          (p) => p.id === post.id,
        );
        expect(postAfter.extendedLikesInfo.likesCount).toEqual(0);

        // await postsTestManager.getPostById(postByFirstToken.id, secondPlayerToken);

        // get post banned user
        const { extendedLikesInfo } = await postsTestManager.getPostById(
          postByFirstToken.id,
          secondPlayerToken,
        );

        expect(
          extendedLikesInfo.likesCount && extendedLikesInfo.dislikesCount,
        ).toBe(0);
        expect(extendedLikesInfo.myStatus).toBe(LikesStatuses.None);

        // unban second user
        await saManager.banUser(
          users[1].id,
          saManager.createBanRestriction({ isBanned: false }),
        );

        const { accessToken: secondPlayerTokenAfterUnban } =
          await usersTestManager.authLogin(users[1]);
        const { extendedLikesInfo: likesInfoAfterUnban } =
          await postsTestManager.getPostById(
            postByFirstToken.id,
            secondPlayerTokenAfterUnban,
          );

        expect(likesInfoAfterUnban.likesCount).toBe(1);
      });
    });
  },
);
