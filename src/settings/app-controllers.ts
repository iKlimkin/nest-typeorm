// import {
//   BlogsController,
//   FeedbacksController,
//   PostsController,
//   SABlogsController,
//   TestDatabaseController,
// } from '.';

import { AppController } from "../app.controller";
import { TestDatabaseController } from "../data-testing/test.db.controller";
import { BlogsController } from "../features/blogs/api/controllers/blogs.controller";
import { SABlogsController } from "../features/blogs/api/controllers/sa-blogs.controller";
import { FeedbacksController } from "../features/comments/api/controllers/feedbacks.controller";
import { PostsController } from "../features/posts/api/controllers/posts.controller";

export const controllers = [
  BlogsController,

  PostsController,

  FeedbacksController,

  SABlogsController,

  AppController,

  TestDatabaseController,
];
