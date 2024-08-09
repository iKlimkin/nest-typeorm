import { HttpServer, HttpStatus, INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TelegramCTX } from '../../src/features/integrations/api/models/telegram-types';
import { TelegramAdapter } from '../../src/infra/adapters/telegram.adapter';
import { configureTestSetup } from '../tools/fixtures/setup-environment';
import { RouterPaths } from '../tools/helpers/routing';
import {
  BloggerBlogsTestManager,
  BlogTestManager,
  PublicBlogsTestManager,
  SABlogsTestManager,
} from '../tools/managers/BlogsTestManager';
import { IntegrationsTestManager } from '../tools/managers/IntegrationsTestManager';
import { PostsTestManager } from '../tools/managers/PostsTestManager';
import { SATestManager } from '../tools/managers/SATestManager';
import { UsersTestManager } from '../tools/managers/UsersTestManager';
import { aDescribe } from '../tools/utils/aDescribe';
import { cleanDatabase } from '../tools/utils/dataBaseCleanup';
import { initSettings } from '../tools/utils/initSettings';
import { e2eTestNamesEnum, skipSettings } from '../tools/utils/testsSettings';
import { ConfigService } from '@nestjs/config';
import {
  SetWebhookTelegramBotCommand,
  SetWebhookTelegramBotUseCase,
} from '../../src/features/integrations/application/use-cases/set-hook-telegram-bot.use-case';
import { connectToNgrok } from '../../src/settings/integration.settings/ngrok-connect';
import { SubscribeEnum } from '../../src/features/blogs/api/models/output.blog.models/blog.view.model-type';

jest.mock('../../src/settings/integration.settings/ngrok-connect');

aDescribe(skipSettings.for(e2eTestNamesEnum.integrations))(
  'TelegramController (e2e)',
  () => {
    let app: INestApplication;
    let publicBlogsManager: PublicBlogsTestManager;
    let bloggerTestManager: BloggerBlogsTestManager;
    let dataSource: DataSource;
    let httpServer: HttpServer;
    let usersTestManager: UsersTestManager;
    let saTestManager: SATestManager;
    let saBlogTestManager: SABlogsTestManager;
    let postTestManager: PostsTestManager;
    let integrationsTestManager: IntegrationsTestManager;
    let telegramAdapter: TelegramAdapter;
    let useCase: SetWebhookTelegramBotUseCase;
    let configService: ConfigService;

    beforeAll(async () => {
      const testSettings = await initSettings();

      app = testSettings.app;
      httpServer = testSettings.httpServer;
      dataSource = testSettings.testingAppModule.get(DataSource);
      const { createTestManager } = new BlogTestManager(app);
      const createManager = createTestManager.bind(new BlogTestManager(app));

      telegramAdapter = testSettings.testingAppModule.get(TelegramAdapter);

      const apiRouting = testSettings.apiRouting;
      saTestManager = new SATestManager(app, apiRouting.SAUsers);
      saBlogTestManager = createManager(RouterPaths.SABlogs);
      postTestManager = new PostsTestManager(app, apiRouting.posts);
      publicBlogsManager = createManager(
        RouterPaths.blogs,
      ) as PublicBlogsTestManager;
      bloggerTestManager = createManager(
        RouterPaths.blogger,
      ) as BloggerBlogsTestManager;

      usersTestManager = testSettings.usersTestManager;

      integrationsTestManager = new IntegrationsTestManager(
        app,
        apiRouting.integrations,
      );
    });

    beforeEach(() => {
      (connectToNgrok as jest.Mock).mockResolvedValue(
        'https://static-ngrok-url.com',
      );
      jest.spyOn(telegramAdapter, 'setHookToTelegram').mockResolvedValue();
    });

    afterAll(async () => {
      await app.close();
    });

    describe.only('SUBSCRIBE', () => {
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

      it('/integrations/telegram - checking the mailing list for subscribed users', async () => {
        const {
          firstPlayerToken,
          secondPlayerToken,
          thirdPlayerToken,
          blogByFirstToken,
          users,
        } = expect.getState();

        await integrationsTestManager.setTelegramBotWebhook();
        expect(connectToNgrok).toHaveBeenCalled();
        expect(telegramAdapter.setHookToTelegram).toHaveBeenCalledWith(
          'https://static-ngrok-url.com/integrations/telegram',
        );

        const linkFirstUser =
          await integrationsTestManager.getAuthBotPersonalLink(
            secondPlayerToken,
          );
        const tgIds = [123, 123456];
        const [_, code] = linkFirstUser.split('=');
        const mockMessageFromTgFirstUser = {
          message: {
            from: { id: tgIds[0], username: 'testName' },
            text: `/start ${code}`,
          },
        };
        await integrationsTestManager.forTelegramBotHook(
          mockMessageFromTgFirstUser as TelegramCTX,
        );
        const telegramMetaFirstUser =
          await integrationsTestManager.getTelegramMetaUser(users[1].id);
        expect(+telegramMetaFirstUser.telegramId).toBe(
          mockMessageFromTgFirstUser.message.from.id,
        );
        expect(telegramMetaFirstUser.telegramActivationCode).toBe(code);

        const linkSecondUser =
          await integrationsTestManager.getAuthBotPersonalLink(
            thirdPlayerToken,
          );

        const codeSecondUser = linkSecondUser.split('=')[1];

        const mockMessageFromSecondUser = {
          message: {
            from: { id: tgIds[1], username: 'testName' },
            text: `/start ${codeSecondUser}`,
          },
        };
        await integrationsTestManager.forTelegramBotHook(
          mockMessageFromSecondUser as TelegramCTX,
        );
        const telegramMetaSecondUser =
          await integrationsTestManager.getTelegramMetaUser(users[2].id);
        expect(+telegramMetaSecondUser.telegramId).toBe(
          mockMessageFromSecondUser.message.from.id,
        );
        expect(telegramMetaSecondUser.telegramActivationCode).toBe(
          codeSecondUser,
        );

        await publicBlogsManager.applySubscription(blogByFirstToken.id, firstPlayerToken, HttpStatus.BAD_REQUEST)
        await publicBlogsManager.applySubscription(
          blogByFirstToken.id,
          secondPlayerToken,
        );
        await publicBlogsManager.applySubscription(
          blogByFirstToken.id,
          thirdPlayerToken,
        );
        const subscribersInfo = await publicBlogsManager.getSubscribeInfo(
          blogByFirstToken.id,
        );

        subscribersInfo.forEach((s, i) => {
          expect(s.user.id).toBe(users[i + 1].id);
        });

        const sendMessageSpy = jest
          .spyOn(telegramAdapter, 'sendMessage')
          .mockResolvedValue();

        await bloggerTestManager.createPost(
          bloggerTestManager.createPostInputData({}),
          firstPlayerToken,
          blogByFirstToken.id,
        );

        sendMessageSpy.mock.calls.forEach(([tgId, message]) => {
          expect(tgIds).toContain(tgId);
          expect(message).toContain(blogByFirstToken.name);
        });
      });

      it.skip('/blogs/:blogId (GET) - should return blog with sub info', async () => {
        const { blogByFirstToken, secondPlayerToken } = expect.getState();

        const blog = await publicBlogsManager.getPublicBlog(
          blogByFirstToken.id,
          secondPlayerToken,
        );
        expect(blog.currentUserSubscriptionStatus).toBe(
          SubscribeEnum.Subscribed,
        );
        expect(blog.subscribersCount).toBe(2);

        await publicBlogsManager.unSubscribe(
          blogByFirstToken.id,
          secondPlayerToken,
        );
        const blogAfterSecondUnSubscription =
          await publicBlogsManager.getPublicBlog(
            blogByFirstToken.id,
            secondPlayerToken,
          );
        expect(
          blogAfterSecondUnSubscription.currentUserSubscriptionStatus,
        ).toBe(SubscribeEnum.Unsubscribed);

        const blogWithoutToken = await publicBlogsManager.getPublicBlog(
          blogByFirstToken.id,
        );
        expect(blogWithoutToken.currentUserSubscriptionStatus).toBe(
          SubscribeEnum.None,
        );
        expect(blogWithoutToken.subscribersCount).toBe(1);
      });

      it('/blogs (GET) - get all blogs with sub info', async () => {
        const {
          blogByFirstToken,
          blogBySecondToken,
          secondPlayerToken,
          firstPlayerToken,
        } = expect.getState();

        console.log({ blogByFirstToken, firstPlayerToken });

        // const blogs = await publicBlogsManager.getPublicBlogs(secondPlayerToken);
      });
    });
    describe(`UNSUBSCRIBE`, () => {
      beforeAll(async () => {
        await configureTestSetup(
          () => ({
            usersTestManager,
            bloggerTestManager,
          }),
          {
            blogs: { quantity: 10 },
            posts: { quantity: 5 },
          },
        );
      });

      afterAll(async () => {
        await cleanDatabase(httpServer);
      });

      it('/blogs (GET) - /blogs/:id/posts', async () => {
        const { postByFirstToken, postBySecondToken, posts, blogs } =
          expect.getState();
        const analyzedBlogId = postByFirstToken.blogId;
        const postsRelatedToTheBlog = posts.filter(
          (post) => post.blogId === analyzedBlogId,
        );

        expect(postsRelatedToTheBlog.length).toBeGreaterThan(0);
        const amountOfPosts = postsRelatedToTheBlog.length;
        await saBlogTestManager.banUnbanBlog(postByFirstToken.blogId, {
          isBanned: true,
        });

        const getPostsByBlogIdAfterBlogBan =
          await publicBlogsManager.getPublicPostsByBlogId(
            analyzedBlogId,
            HttpStatus.NOT_FOUND,
          );

        await saBlogTestManager.banUnbanBlog(analyzedBlogId, {
          isBanned: false,
        });

        const getPostsByBlogIdAfterBlogUnban =
          await publicBlogsManager.getPublicPostsByBlogId(analyzedBlogId);
        expect(getPostsByBlogIdAfterBlogUnban.length).toEqual(amountOfPosts);
      });

      it(`GET all posts`, async () => {
        const { postByFirstToken, postBySecondToken, posts, blogs } =
          expect.getState();
        const analyzedBlogId = postByFirstToken.blogId;

        const postsWithPagingBeforeBan = await postTestManager.getPosts();
        const postsTotalCountBeforeBanBlog =
          postsWithPagingBeforeBan.totalCount;

        await saBlogTestManager.banUnbanBlog(analyzedBlogId, {
          isBanned: true,
        });

        const postsWithPagingAfterBan = await postTestManager.getPosts();
        expect(postsWithPagingAfterBan.totalCount).toBeLessThan(
          postsTotalCountBeforeBanBlog,
        );

        // can not get a post because of the ban blog to which it belongs
        await postTestManager.getPostById(
          postByFirstToken.id,
          null,
          HttpStatus.NOT_FOUND,
        );
      });
    });
  },
);
