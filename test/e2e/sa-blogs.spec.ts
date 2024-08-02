import { HttpServer, HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { SortDirections } from '../../src/domain/sorting-base-filter';
import { BlogsQueryFilter } from '../../src/features/blogs/api/models/input.blog.models/blogs-query.filter';
import { SABlogsViewType } from '../../src/features/blogs/api/models/output.blog.models/blog.view.model-type';
import { configureTestSetup } from '../tools/fixtures/setup-environment';
import { RouterPaths } from '../tools/helpers/routing';
import {
  BloggerBlogsTestManager,
  BlogTestManager,
  SABlogsTestManager,
} from '../tools/managers/BlogsTestManager';
import { UsersTestManager } from '../tools/managers/UsersTestManager';
import { PaginationModel } from '../tools/models/pagination-model';
import { aDescribe } from '../tools/utils/aDescribe';
import { cleanDatabase } from '../tools/utils/dataBaseCleanup';
import { initSettings } from '../tools/utils/initSettings';
import { e2eTestNamesEnum, skipSettings } from '../tools/utils/testsSettings';

aDescribe(skipSettings.for(e2eTestNamesEnum.SABlogs))(
  'SABlogsController (e2e)',
  () => {
    let app: INestApplication;
    let httpServer: HttpServer;
    let testingAppModule: TestingModule;
    let saBlogTestManager: SABlogsTestManager;
    let bloggerTestManager: BloggerBlogsTestManager;
    let usersTestManager: UsersTestManager;
    let dataSource: DataSource;
    let paginationModel: PaginationModel<SABlogsViewType>;

    beforeAll(async () => {
      const testSettings = await initSettings();

      testingAppModule = testSettings.testingAppModule;
      usersTestManager = testSettings.usersTestManager;

      dataSource = testingAppModule.get<DataSource>(DataSource);
      app = testSettings.app;
      httpServer = testSettings.httpServer;

      const { createTestManager } = new BlogTestManager(app);
      const createManager = createTestManager.bind(new BlogTestManager(app));

      saBlogTestManager = createManager(
        RouterPaths.SABlogs,
      ) as SABlogsTestManager;
      bloggerTestManager = createManager(
        RouterPaths.blogger,
      ) as BloggerBlogsTestManager;

      paginationModel = new PaginationModel();
    });

    afterAll(async () => {
      await cleanDatabase(httpServer);
      await app.close();
    });

    describe('testing get blogs with paging', () => {
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

      it(`/sa/blogs (GET) - shouldn't get blogs without basic auth`, async () => {
        await saBlogTestManager.getSABlogs(
          null,
          false,
          HttpStatus.UNAUTHORIZED,
        );
      });
      it('/sa/blogs (GET) - should receive blogs with sa auth', async () => {
        const paginationBlogsResult = await saBlogTestManager.getSABlogs();
        const blogs = paginationBlogsResult.items;
        blogs.forEach((blog) => {
          expect(
            blog.blogOwnerInfo.userId && blog.blogOwnerInfo.userLogin,
          ).toBeDefined();
        });
        expect(blogs.length).toBe(10);
        console.log({ blogs: JSON.stringify(blogs) });

        const queryOptions: Partial<BlogsQueryFilter> = {
          pageSize: '9',
          pageNumber: '1',
          sortBy: 'name',
          sortDirection: SortDirections.ASC,
        };
        const paginationBlogsResultWithQuery =
          await saBlogTestManager.getSABlogs(queryOptions);
        const blogsWithQuery = paginationBlogsResultWithQuery.items;

        saBlogTestManager.isSortedByField<SABlogsViewType>({
          entities: blogsWithQuery,
          field: queryOptions.sortBy as 'name',
          sortDirection: queryOptions.sortDirection,
        });

        // const pBlogs = paginationModel.getData(paginationBlogsResult);
        // console.log({ blogs, pBlogs });

        const queryOptionsOther: Partial<BlogsQueryFilter> = {
          pageSize: '5',
          pageNumber: '2',
          sortBy: 'default',
          sortDirection: SortDirections.ASC,
        };
        const paginationBlogsResultWithQueryOptions =
          await saBlogTestManager.getSABlogs(queryOptionsOther);
        const blogsWithQueryOptions =
          paginationBlogsResultWithQueryOptions.items;
        expect(blogsWithQueryOptions.length).toBe(5);
      });

      it("/sa/blogs (post) - shouldn't create blog without auth", async () => {});
    });

    describe('testing bind blog without owner with user', () => {
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

      it('/sa/blogs/:id/bind-with-user/:userId (PUT) - should not bind blog with user, blog is already bound, 403', async () => {
        const { users, blogByFirstToken } = expect.getState();
        const [firstUser] = users;

        await saBlogTestManager.bindBlog(
          blogByFirstToken.id,
          firstUser.id,
          HttpStatus.BAD_REQUEST,
        );
      });

      it('/sa/blogs/:id/bind-with-user/:userId (PUT) - should bind blog with user', async () => {
        const { users, blogByFirstToken } = expect.getState();
        const [firstUser] = users;

        const [blogBefore] = await dataSource.query(
          `SELECT * FROM blog WHERE id = $1`,
          [blogByFirstToken.id],
        );
        expect(blogBefore.ownerId).toBeDefined();

        await dataSource.query(
          `UPDATE blog SET "ownerId" = NULL WHERE id = $1`,
          [blogByFirstToken.id],
        );

        const [blogAfter] = await dataSource.query(
          `SELECT * FROM blog WHERE id = $1`,
          [blogByFirstToken.id],
        );

        expect(blogAfter.ownerId).toBeNull();

        await saBlogTestManager.bindBlog(blogByFirstToken.id, firstUser.id);
      });

      it('/sa/blogs/:id/bind-with-user/:userId (PUT) - ', async () => {});
    });
  },
);
