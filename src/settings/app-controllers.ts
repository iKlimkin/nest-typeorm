import { TestDatabaseController } from '../data-testing/test.db.controller';
import { BlogsController } from '../features/blogs/api/controllers/blogs.controller';
import { SABlogsController } from '../features/blogs/api/controllers/sa-blogs.controller';

export const controllers = [
  BlogsController,

  PostsController,

  FeedbacksController,

  SABlogsController,

  TestDatabaseController,
];
