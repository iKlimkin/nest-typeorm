import { RouterPaths } from '../../../src/infra/utils/routing';
import { BloggerUsersRouting } from './bloggerUsers.routing';
import { BlogsRouting } from './blogs.routing';
import { FeedbacksRouting } from './feedbacks.routing';
import { PaymentsRouting } from './payments.routing';
import { PostsRouting } from './posts.routing';
import { QuizPairsRouting } from './quizPairs.routing';
import { QuizQuestionsRouting } from './quizQuestions.routing';
import { SAUsersRouting } from './sa-users.routing';
import { TelegramRouting } from './telegram.routing';
import { AuthUsersRouting } from './users.routing';

export class ApiRouting implements RoutingInterface {
  questions: QuizQuestionsRouting;
  pairs: QuizPairsRouting;
  bloggerBlogs: BlogsRouting;
  blogs: BlogsRouting;
  SABlogs: BlogsRouting;
  SAUsers: SAUsersRouting;
  comments: FeedbacksRouting;
  posts: PostsRouting;
  users: AuthUsersRouting;
  bloggerUsers: BloggerUsersRouting;
  integrations: {
    telegram: TelegramRouting;
    payments: PaymentsRouting;
  };

  constructor() {
    this.questions = new QuizQuestionsRouting();
    this.pairs = new QuizPairsRouting();
    this.bloggerBlogs = new BlogsRouting(RouterPaths.blogger);
    this.blogs = new BlogsRouting(RouterPaths.blogs);
    this.SABlogs = new BlogsRouting(RouterPaths.SABlogs);
    this.SAUsers = new SAUsersRouting(RouterPaths.users);
    this.comments = new FeedbacksRouting(RouterPaths.comments);
    this.posts = new PostsRouting(RouterPaths.posts);
    this.users = new AuthUsersRouting(RouterPaths.auth);
    this.bloggerUsers = new BloggerUsersRouting(RouterPaths.bloggerUsers);
    this.integrations = {
      telegram: new TelegramRouting(),
      payments: new PaymentsRouting(),
    };
  }
}

export interface RoutingInterface {
  bloggerBlogs: BlogsRouting;
  blogs: BlogsRouting;
  SABlogs: BlogsRouting;
  questions: QuizQuestionsRouting;
  pairs: QuizPairsRouting;
  integrations: {
    telegram: TelegramRouting;
    payments: PaymentsRouting;
  };
}
