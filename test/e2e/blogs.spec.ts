import { HttpServer, INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { configureTestSetup } from '../tools/fixtures/setup-environment';
import { RouterPaths } from '../tools/helpers/routing';
import { createBlogsDataForTests } from '../tools/helpers/structure-validation.helpers';
import {
  BloggerBlogsTestManager,
  BlogTestManager,
  PublicBlogsTestManager,
} from '../tools/managers/BlogsTestManager';
import { UsersTestManager } from '../tools/managers/UsersTestManager';
import { aDescribe } from '../tools/utils/aDescribe';
import { cleanDatabase } from '../tools/utils/dataBaseCleanup';
import { initSettings } from '../tools/utils/initSettings';
import { skipSettings } from '../tools/utils/testsSettings';

aDescribe(skipSettings.for('blogs'))('BlogsController (e2e)', () => {
  let app: INestApplication;
  let publicBlogsManager: PublicBlogsTestManager;
  let bloggerTestManager: BloggerBlogsTestManager;
  let dataSource: DataSource;
  let httpServer: HttpServer;
  let usersTestManager: UsersTestManager;

  beforeAll(async () => {
    const testSettings = await initSettings();

    app = testSettings.app;
    httpServer = testSettings.httpServer;
    dataSource = testSettings.testingAppModule.get(DataSource);
    const { createTestManager } = new BlogTestManager(app);
    const createManager = createTestManager.bind(new BlogTestManager(app));

    publicBlogsManager = createManager(
      RouterPaths.blogs,
    ) as PublicBlogsTestManager;
    bloggerTestManager = createManager(
      RouterPaths.blogger,
    ) as BloggerBlogsTestManager;

    usersTestManager = testSettings.usersTestManager;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET blogs', () => {
    afterAll(async () => {
      await cleanDatabase(httpServer);
    });
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

    it('/blogs (GET) - should return blogs with paging', async () => {
      const blogsInDb = await publicBlogsManager.getPublicBlogs();
      const localBlogs = createBlogsDataForTests();
    });

    it('/blogs/:blogId (GET) - should return blog by id', async () => {
      const { blogByFirstToken, blogBySecondToken } = expect.getState();

      const firstBlog = await publicBlogsManager.getPublicBlog(
        blogByFirstToken.id,
      );
      const secondBlog = await publicBlogsManager.getPublicBlog(
        blogBySecondToken.id,
      );

      console.log({ firstBlog, secondBlog });
    });

    it('/blogs/:blogId/posts (GET) - should return posts for blog with paging', async () => {
      const { blogByFirstToken, blogBySecondToken } = expect.getState();

      const postsByFirstBlog = await publicBlogsManager.getPublicPostsByBlogId(
        blogByFirstToken.id,
      );

      const postsBySecondBlog = await publicBlogsManager.getPublicPostsByBlogId(
        blogBySecondToken.id,
      );

      console.log(postsByFirstBlog, postsBySecondBlog);
    });
  });
});
