import { HttpServer, HttpStatus, INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { configureTestSetup } from '../tools/fixtures/setup-environment';
import { RouterPaths } from '../tools/helpers/routing';
import { createBlogsDataForTests } from '../tools/helpers/structure-validation.helpers';
import {
  BloggerBlogsTestManager,
  BlogTestManager,
  PublicBlogsTestManager,
  SABlogsTestManager,
} from '../tools/managers/BlogsTestManager';
import { UsersTestManager } from '../tools/managers/UsersTestManager';
import { aDescribe } from '../tools/utils/aDescribe';
import { cleanDatabase } from '../tools/utils/dataBaseCleanup';
import { initSettings } from '../tools/utils/initSettings';
import { e2eTestNamesEnum, skipSettings } from '../tools/utils/testsSettings';
import { SATestManager } from '../tools/managers/SATestManager';
import { PostsTestManager } from '../tools/managers/PostsTestManager';
import { post } from 'superagent';

aDescribe(skipSettings.for(e2eTestNamesEnum.blogs))(
  'BlogsController (e2e)',
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

    beforeAll(async () => {
      const testSettings = await initSettings();

      app = testSettings.app;
      httpServer = testSettings.httpServer;
      dataSource = testSettings.testingAppModule.get(DataSource);
      const { createTestManager } = new BlogTestManager(app);
      const createManager = createTestManager.bind(new BlogTestManager(app));

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

      it.only('/blogs (GET) - should return blogs with paging', async () => {
        const { firstPlayerToken, postByFirstToken } = expect.getState();

        const resizedWallBuffer = await bloggerTestManager.prepareFileToSend(
          'size-52kb',
          {
            width: 1028,
            height: 312,
          },
        );

        const resizedMainImageBuffer =
          await bloggerTestManager.prepareFileToSend('size-52kb', {
            width: 156,
            height: 156,
          });

        await bloggerTestManager.uploadBackWallForBlog({
          accessToken: firstPlayerToken,
          blogId: postByFirstToken.blogId,
          fileBuffer: resizedWallBuffer,
        });

        for (let i = 0; i < 3; i++) {
          await bloggerTestManager.uploadBlogMainImage({
            accessToken: firstPlayerToken,
            blogId: postByFirstToken.blogId,
            fileBuffer: resizedMainImageBuffer,
          });
        }

        const publicBlogs = await publicBlogsManager.getPublicBlogs();
        const blog = await publicBlogsManager.getPublicBlog(
          postByFirstToken.blogId,
        );
      });

      it('/blogs/:blogId (GET) - should return blog by id', async () => {
        const { blogByFirstToken, blogBySecondToken } = expect.getState();

        const firstBlog = await publicBlogsManager.getPublicBlog(
          blogByFirstToken.id,
        );
        const secondBlog = await publicBlogsManager.getPublicBlog(
          blogBySecondToken.id,
        );
      });

      it('/blogs/:blogId/posts (GET) - should return posts for blog with paging', async () => {
        const { blogByFirstToken, blogBySecondToken } = expect.getState();

        const postsByFirstBlog =
          await publicBlogsManager.getPublicPostsByBlogId(blogByFirstToken.id);

        const postsBySecondBlog =
          await publicBlogsManager.getPublicPostsByBlogId(blogBySecondToken.id);
      });
    });
    describe(`GET posts by banned blogs`, () => {
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
