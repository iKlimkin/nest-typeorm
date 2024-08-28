import { HttpServer, HttpStatus, INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TelegramAdapter } from '../../src/infra/adapters/telegram.adapter';
import { configureTestSetup } from '../tools/fixtures/setup-environment';
import { RouterPaths } from '../../src/infra/utils/routing';
import {
  BloggerBlogsTestManager,
  BlogTestManager,
  PublicBlogsTestManager,
  SABlogsTestManager,
} from '../tools/managers/BlogsTestManager';
import { PostsTestManager } from '../tools/managers/PostsTestManager';
import { SATestManager } from '../tools/managers/SATestManager';
import { UsersTestManager } from '../tools/managers/UsersTestManager';
import { aDescribe } from '../tools/utils/aDescribe';
import { cleanDatabase, clearDB } from '../tools/utils/dataBaseCleanup';
import { initSettings } from '../tools/utils/initSettings';
import { e2eTestNamesEnum, skipSettings } from '../tools/utils/testsSettings';
import { ConfigService } from '@nestjs/config';
import { connectToNgrok } from '../../src/settings/integration.settings/ngrok-connect';
import { SubscribeEnum } from '../../src/features/blogs/api/models/output.blog.models/blog.view.model-type';
import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { TelegramCTX } from '../../src/features/integrations/telegram/api/models/input/telegram-types';
import { SetWebhookTelegramBotUseCase } from '../../src/features/integrations/telegram/application/use-cases/set-hook-telegram-bot.use-case';
import { ConfigurationType } from '../../src/settings/config/configuration';
import {
  IntegrationsTestManagerCreator,
  PaymentsTestManager,
  TelegramTestManager,
} from '../tools/managers/IntegrationsTestManager';
import { IntegrationMethod } from '../../src/infra/enum/integration.enums';
import { wait } from '../tools/utils/delayUtils';

jest.mock('../../src/settings/integration.settings/ngrok-connect');

aDescribe(skipSettings.for(e2eTestNamesEnum.telegram))(
  'TelegramController (e2e)',
  () => {
    let app: INestApplication;
    let publicBlogsManager: PublicBlogsTestManager;
    let bloggerTestManager: BloggerBlogsTestManager;
    let publicBlogManager: PublicBlogsTestManager;
    let dataSource: DataSource;
    let httpServer: HttpServer;
    let usersTestManager: UsersTestManager;
    let saTestManager: SATestManager;
    let saBlogTestManager: SABlogsTestManager;
    let postTestManager: PostsTestManager;
    let telegramTestManager: TelegramTestManager;
    let paymentsTestManager: PaymentsTestManager;
    let telegramAdapter: TelegramAdapter;
    let useCase: SetWebhookTelegramBotUseCase;
    let configService: ConfigService<ConfigurationType>;
    let testBot: Telegraf;
    let interactHubBot: Telegraf;
    let chatId: number;

    beforeAll(async () => {
      const testSettings = await initSettings();

      app = testSettings.app;
      configService = testSettings.configService;
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
      publicBlogManager = createManager(RouterPaths.blogs);

      usersTestManager = testSettings.usersTestManager;

      const integrationTestManagerCreator = new IntegrationsTestManagerCreator(
        app,
      );
      telegramTestManager =
        integrationTestManagerCreator.createIntegrationManager(
          IntegrationMethod.Telegram,
        ) as TelegramTestManager;
      paymentsTestManager =
        integrationTestManagerCreator.createIntegrationManager(
          IntegrationMethod.Stripe,
        ) as PaymentsTestManager;
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

    describe('SUBSCRIBE', () => {
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

        await telegramTestManager.setTelegramBotWebhook();
        expect(connectToNgrok).toHaveBeenCalled();
        expect(telegramAdapter.setHookToTelegram).toHaveBeenCalledWith(
          'https://static-ngrok-url.com/integrations/telegram',
        );

        const linkFirstUser = await telegramTestManager.getAuthBotPersonalLink(
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
        await telegramTestManager.forTelegramBotHook(
          mockMessageFromTgFirstUser as TelegramCTX,
        );
        const telegramMetaFirstUser =
          await telegramTestManager.getTelegramMetaUser(users[1].id);
        expect(+telegramMetaFirstUser.telegramId).toBe(
          mockMessageFromTgFirstUser.message.from.id,
        );
        expect(telegramMetaFirstUser.telegramActivationCode).toBe(code);

        const linkSecondUser = await telegramTestManager.getAuthBotPersonalLink(
          thirdPlayerToken,
        );

        const codeSecondUser = linkSecondUser.split('=')[1];

        const mockMessageFromSecondUser = {
          message: {
            from: { id: tgIds[1], username: 'testName' },
            text: `/start ${codeSecondUser}`,
          },
        };
        await telegramTestManager.forTelegramBotHook(
          mockMessageFromSecondUser as TelegramCTX,
        );
        const telegramMetaSecondUser =
          await telegramTestManager.getTelegramMetaUser(users[2].id);
        expect(+telegramMetaSecondUser.telegramId).toBe(
          mockMessageFromSecondUser.message.from.id,
        );
        expect(telegramMetaSecondUser.telegramActivationCode).toBe(
          codeSecondUser,
        );

        await publicBlogsManager.applySubscription(
          blogByFirstToken.id,
          firstPlayerToken,
          HttpStatus.BAD_REQUEST,
        );
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

        const blogs = await publicBlogsManager.getPublicBlogs(
          secondPlayerToken,
        );
      });
    });
    describe(`BOT TESTING`, () => {
      beforeAll(async () => {
        await configureTestSetup(
          () => ({
            usersTestManager,
            bloggerTestManager,
          }),
          { blogs: true },
        );

        const { botForTestsToken, token } = configService.get('telegram', {
          infer: true,
        });
        testBot = new Telegraf(botForTestsToken);
        interactHubBot = new Telegraf(token);
        testBot.on(message('text'), async (ctx) => {
          chatId = ctx.message.chat.id;
          await ctx.telegram.sendMessage(
            ctx.message.chat.id,
            `Hello ${ctx.from.username}`,
          );
          await ctx.reply(`You said: ${ctx.message}`);
        });

        await testBot.launch();

        await testBot.telegram.sendMessage('@NoticeHubBot', '/start');
      });

      afterAll(async () => {
        await cleanDatabase(httpServer);
        testBot.stop();
      });

      it('/blogs (GET) - /blogs/:id/posts', async () => {
        const {
          firstPlayerToken,
          secondPlayerToken,
          thirdPlayerToken,
          blogByFirstToken,
          users,
        } = expect.getState();

        const personalLink = await telegramTestManager.getAuthBotPersonalLink(
          secondPlayerToken,
        );
        const [_, code] = personalLink.split('=');
        // testBot.telegram.sendMessage('chatId', '/start code')
      });
    });

    describe.only('test stripe integration', () => {
      beforeAll(async () => {
        await configureTestSetup(
          () => ({
            usersTestManager,
            bloggerTestManager,
          }),
          { blogs: true },
        );
      });

      afterAll(async () => {
        // await clearDB(dataSource);
      });

      it('create plans for blog', async () => {
        const {
          firstPlayerToken,
          secondPlayerToken,
          thirdPlayerToken,
          blogByFirstToken,
          users,
        } = expect.getState();
        console.log({ blogByFirstToken, firstPlayerToken });

        await wait(4);
        const blogPlans = await publicBlogManager.getMembershipPlans(
          blogByFirstToken.id,
        );
        const { url } = await publicBlogManager.joinTheMembershipPlan(
          secondPlayerToken,
          blogByFirstToken.id,
          blogPlans[0].id,
        );
        console.log({ url });
      });
    });
  },
);
