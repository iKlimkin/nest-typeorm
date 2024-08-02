import { HttpServer, HttpStatus, INestApplication } from '@nestjs/common';
import { BlogViewModelType } from '../../src/features/blogs/api/models/output.blog.models/blog.view.model-type';
import { configureTestSetup } from '../tools/fixtures/setup-environment';
import { RouterPaths } from '../tools/helpers/routing';
import {
  BloggerBlogsTestManager,
  BlogTestManager,
  PublicBlogsTestManager,
} from '../tools/managers/BlogsTestManager';
import { PostsTestManager } from '../tools/managers/PostsTestManager';
import { SATestManager } from '../tools/managers/SATestManager';
import { UsersTestManager } from '../tools/managers/UsersTestManager';
import { PaginationModel } from '../tools/models/pagination-model';
import { aDescribe } from '../tools/utils/aDescribe';
import { cleanDatabase } from '../tools/utils/dataBaseCleanup';
import { initSettings } from '../tools/utils/initSettings';
import { e2eTestNamesEnum, skipSettings } from '../tools/utils/testsSettings';
import { ApiRouting } from '../tools/routes/api.routing';
import { BloggerUsersTestManager } from '../tools/managers/BloggerUsersTestManager';
import { constants } from '../tools/helpers/constants';
import { BloggerBannedUsersQueryFilter } from '../../src/features/admin/api/models/outputSA.models.ts/blogger-banned-users.query';
import { SortDirections } from '../../src/domain/sorting-base-filter';

aDescribe(skipSettings.for(e2eTestNamesEnum.bloggerUsers))(
  'BloggerUsersController (e2e)',
  () => {
    let app: INestApplication;
    let bloggerTestManager: BloggerBlogsTestManager;
    let usersTestManager: UsersTestManager;
    let httpServer: HttpServer;
    let paginationModel: PaginationModel<BlogViewModelType>;
    let publicBlogsTestManager: PublicBlogsTestManager;
    let postsTestManager: PostsTestManager;
    let saTestManager: SATestManager;
    let apiRouting: ApiRouting;
    let bloggerUsersTestManager: BloggerUsersTestManager;
    beforeAll(async () => {
      try {
        const settings = await initSettings();
        app = settings.app;
        httpServer = settings.httpServer;
        apiRouting = settings.apiRouting;
        const { createTestManager } = new BlogTestManager(app);
        const createManager = createTestManager.bind(new BlogTestManager(app));

        bloggerTestManager = createManager(
          RouterPaths.blogger,
        ) as BloggerBlogsTestManager;

        publicBlogsTestManager = createManager(
          RouterPaths.blogs,
        ) as PublicBlogsTestManager;
        bloggerUsersTestManager = new BloggerUsersTestManager(
          app,
          apiRouting.bloggerUsers,
        );
        usersTestManager = settings.usersTestManager;
        postsTestManager = new PostsTestManager(app, apiRouting.posts);
        saTestManager = new SATestManager(app, apiRouting.SAUsers);
        paginationModel = new PaginationModel();
      } catch (error) {
        console.error(error);
      }
    });

    afterAll(async () => {
      await app.close();
    });

    describe('testing ban/unban user (PUT) -> "blogger/users")', () => {
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
          { users: { quantity: 5 }, comments: true },
        );
      });

      it(`after auto-testing: GET -> "blogger/users/blog/:id": should return status 200; content: banned users array with pagination; used additional methods: POST -> /sa/users, PUT -> /blogger/users/:id/ban;`, async () => {
        const { firstPlayerToken, secondPlayerToken, users, blogs, posts } =
          expect.getState();
        const analyzedBlogId = posts[0].blogId;
        const firstUserRestriction =
          bloggerUsersTestManager.createBanRestriction({
            isBanned: true,
            blogId: analyzedBlogId,
          });

        await bloggerUsersTestManager.banUnbanRestriction(
          users[1].id,
          firstPlayerToken,
          firstUserRestriction,
        );

        const secondUserRestriction =
          bloggerUsersTestManager.createBanRestriction({
            isBanned: true,
            blogId: analyzedBlogId,
          });

        await bloggerUsersTestManager.banUnbanRestriction(
          users[2].id,
          firstPlayerToken,
          secondUserRestriction,
        );

        const thirdUserRestriction =
          bloggerUsersTestManager.createBanRestriction({
            isBanned: true,
            blogId: analyzedBlogId,
          });

        await bloggerUsersTestManager.banUnbanRestriction(
          users[3].id,
          firstPlayerToken,
          thirdUserRestriction,
        );

        await bloggerUsersTestManager.getBannedUsersForCurrentBlog(
          constants.inputData.validUUID,
          firstPlayerToken,
          null,
          HttpStatus.NOT_FOUND,
        );

        const bannedUsersForAnalyzedBlog =
          await bloggerUsersTestManager.getBannedUsersForCurrentBlog(
            analyzedBlogId,
            firstPlayerToken,
            null,
          );

        expect(
          bannedUsersForAnalyzedBlog.items.length &&
            bannedUsersForAnalyzedBlog.totalCount,
        ).toBe(3);
      });

      it(`PUT -> "/blogger/users/:id/ban", GET -> "blogger/users/blog/:id": should return error if access denied; status 403; used additional methods: POST => /sa/users, POST => /auth/login, POST => /blogger/blogs;`, async () => {
        const { firstPlayerToken, secondPlayerToken, users, blogs, posts } =
          expect.getState();

        const analyzedBlogId = posts[0].blogId;
        const userRestriction = bloggerUsersTestManager.createBanRestriction({
          isBanned: true,
          blogId: analyzedBlogId,
        });
        await bloggerUsersTestManager.banUnbanRestriction(
          users[1].id,
          firstPlayerToken,
          userRestriction,
        );

        const query: Partial<BloggerBannedUsersQueryFilter> = {
          pageSize: '9',
          pageNumber: '1',
          sortBy: 'login',
          sortDirection: SortDirections.asc,
        };

        await bloggerUsersTestManager.getBannedUsersForCurrentBlog(
          analyzedBlogId,
          secondPlayerToken,
          null,
          HttpStatus.FORBIDDEN,
        );
      });

      it(`/blogger/users - try to ban user when we don't have rights, 403`, async () => {
        const {
          firstPlayerToken,
          secondPlayerToken,
          users,
          postBySecondToken,
        } = expect.getState();

        const analyzedBlogId = postBySecondToken.blogId;
        const userRestriction = bloggerUsersTestManager.createBanRestriction({
          isBanned: true,
          blogId: analyzedBlogId,
        });
        await bloggerUsersTestManager.banUnbanRestriction(
          users[1].id,
          firstPlayerToken,
          userRestriction,
          HttpStatus.FORBIDDEN,
        );
        const { items, totalCount } =
          await bloggerUsersTestManager.getBannedUsersForCurrentBlog(
            analyzedBlogId,
            firstPlayerToken,
          );
        expect(items.length && totalCount).toBe(0);
      });
      it('/blogger/users (PUT)', async () => {
        const {
          firstPlayerToken,
          secondPlayerToken,
          postByFirstToken,
          postBySecondToken,
          users,
        } = expect.getState();
        const analyzedBlogId = postByFirstToken.blogId;

        const userRestriction = bloggerUsersTestManager.createBanRestriction({
          isBanned: true,
          blogId: analyzedBlogId,
        });

        await bloggerUsersTestManager.banUnbanRestriction(
          users[0].id,
          firstPlayerToken,
          userRestriction,
        );

        const bannedUsers =
          await bloggerUsersTestManager.getBannedUsersForCurrentBlog(
            analyzedBlogId,
            firstPlayerToken,
            { sortBy: 'login' },
          );
      });
    });

    describe('test ban validation', () => {
      afterAll(async () => {
        // await cleanDatabase(httpServer);
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

      it('', async () => {
        const {
          firstPlayerToken,
          secondPlayerToken,
          thirdPlayerToken,
          users,
          postByFirstToken,
          postBySecondToken,
        } = expect.getState();
        console.log({
          postByFirstToken,
          firstPlayerToken,
          userToBan: users[2],
          thirdPlayerToken,
        });

        const userRestriction = bloggerUsersTestManager.createBanRestriction({
          isBanned: true,
          blogId: postByFirstToken.blogId,
        });

        await bloggerUsersTestManager.banUnbanRestriction(
          users[2].id,
          firstPlayerToken,
          userRestriction,
        );
        const inputCommentData = postsTestManager.createCommentData({
          postId: postByFirstToken.id,
          accessToken: thirdPlayerToken,
        });
        await postsTestManager.createComment(
          inputCommentData,
          HttpStatus.FORBIDDEN,
        );

        const secondCommentData = postsTestManager.createCommentData({
          postId: postByFirstToken.id,
          accessToken: secondPlayerToken,
        });
        await postsTestManager.createComment(secondCommentData);
      });
    });
  },
);
