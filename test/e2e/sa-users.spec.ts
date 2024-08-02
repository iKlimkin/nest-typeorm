import { HttpServer, HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { configureTestSetup } from '../tools/fixtures/setup-environment';
import { SATestManager } from '../tools/managers/SATestManager';
import { UsersTestManager } from '../tools/managers/UsersTestManager';
import { PaginationModel } from '../tools/models/pagination-model';
import { ApiRouting } from '../tools/routes/api.routing';
import { aDescribe } from '../tools/utils/aDescribe';
import { cleanDatabase } from '../tools/utils/dataBaseCleanup';
import { initSettings } from '../tools/utils/initSettings';
import { e2eTestNamesEnum, skipSettings } from '../tools/utils/testsSettings';
import { AuthUserType } from '../../src/features/auth/api/models/auth.output.models/auth.user.types';
import { BanStatus } from '../../src/features/admin/api/models/outputSA.models.ts/sa-query.filter';
import { SABlogsViewType } from '../../src/features/blogs/api/models/output.blog.models/blog.view.model-type';

aDescribe(skipSettings.for(e2eTestNamesEnum.SAUsers))(
  'SAUsersController (e2e)',
  () => {
    let app: INestApplication;
    let httpServer: HttpServer;
    let testingAppModule: TestingModule;
    let usersTestManager: UsersTestManager;
    let dataSource: DataSource;
    let paginationModel: PaginationModel<SABlogsViewType>;
    let saTestManager: SATestManager;

    beforeAll(async () => {
      const testSettings = await initSettings();
      const apiRouting = new ApiRouting();
      testingAppModule = testSettings.testingAppModule;
      usersTestManager = testSettings.usersTestManager;
      dataSource = testingAppModule.get(DataSource);
      app = testSettings.app;
      httpServer = testSettings.httpServer;

      saTestManager = new SATestManager(app, apiRouting.SAUsers);
      paginationModel = new PaginationModel();
    });

    afterAll(async () => {
      await app.close();
    });

    describe('testing ban users', () => {
      afterAll(async () => {
        // await cleanDatabase(httpServer);
      });
      beforeAll(async () => {
        await configureTestSetup(() => ({ usersTestManager }));
      });

      it(`/sa/blogs (POST) - should bun user, then try to login banned user, 401`, async () => {
        const { users } = expect.getState();
        const firstUser: AuthUserType = users[0];
        const secondUser = users[1];
        const thirdUser = users[2];
        const firstUserId = firstUser.id;

        const restrictionData = saTestManager.createBanRestriction({
          isBanned: true,
        });
        await saTestManager.banUser(firstUserId, restrictionData);
        await usersTestManager.authLogin(
          firstUser,
          true,
          HttpStatus.UNAUTHORIZED,
        );

        await usersTestManager.authLogin(thirdUser);
        await usersTestManager.authLogin(secondUser);

        const paginationUsersInfo = await saTestManager.getUsers();
        const usersInfo = paginationUsersInfo.items;
        usersInfo.forEach((user) => {
          if (firstUser.id === user.id) {
            expect(user.banInfo.isBanned).toBeTruthy();
            expect(user.banInfo.banReason).toBe(restrictionData.banReason);
            expect(user.banInfo.banDate).toBeDefined();
          } else {
            expect(user.banInfo.isBanned).toBeFalsy();
            expect(user.banInfo.banReason && user.banInfo.banDate).toBeNull();
          }
        });
      });
      it('/sa/blogs (GET) - test sort by ban statuses', async () => {
        const queryAll = {
          banStatus: BanStatus.all,
        };
        const allUsers = await saTestManager.getUsers(queryAll);
        expect(allUsers.items.length && allUsers.totalCount).toBe(3);

        const queryBanned = {
          banStatus: BanStatus.banned,
        };
        const bannedUsers = await saTestManager.getUsers(queryBanned);
        bannedUsers.items.forEach((user) => {
          expect(user.banInfo.isBanned).toBeTruthy();
        });
        expect(bannedUsers.items.length && bannedUsers.totalCount).toBe(1);

        const queryNotBanned = {
          banStatus: BanStatus.notBanned,
        };
        const notBannedUsers = await saTestManager.getUsers(queryNotBanned);
        notBannedUsers.items.forEach((user) => {
          expect(user.banInfo.isBanned).toBeFalsy();
        });
        expect(notBannedUsers.items.length && notBannedUsers.totalCount).toBe(
          2,
        );
      });

      it(``, async () => {
        await usersTestManager.createUsersToVerifyValidation();
        const paginationUsersInfo = await saTestManager.getUsers();
        console.log(...paginationUsersInfo.items);
      });
      it('/sa/blogs (GET) - try to refresh token by banned user, should receive error, 401 => move to auth tests logic', async () => {});

      it("/sa/blogs (post) - shouldn't create blog without auth", async () => {});
    });

    describe('testing bind blog without owner with user', () => {
      afterAll(async () => {
        await cleanDatabase(httpServer);
      });
      beforeAll(async () => {});
      it("/sa/blogs (post) - shouldn't create blog without auth", async () => {});
    });
  },
);
