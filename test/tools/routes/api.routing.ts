import { RouterPaths } from '../helpers/routing';
import { BlogsRouting } from './blogs.routing';
import { QuizPairsRouting } from './quizPairs.routing';
import { QuizQuestionsRouting } from './quizQuestions.routing';

export class ApiRouting implements RoutingInterface {
  questions: QuizQuestionsRouting;
  pairs: QuizPairsRouting;
  bloggerBlogs: BlogsRouting;
  blogs: BlogsRouting;
  SABlogs: BlogsRouting;
  constructor() {
    this.questions = new QuizQuestionsRouting();
    this.pairs = new QuizPairsRouting();
    this.bloggerBlogs = new BlogsRouting(RouterPaths.blogger);
    this.blogs = new BlogsRouting(RouterPaths.blogs);
    this.SABlogs = new BlogsRouting(RouterPaths.SABlogs);
  }
}

export interface RoutingInterface {
  bloggerBlogs: BlogsRouting;
  blogs: BlogsRouting;
  SABlogs: BlogsRouting;
  questions: QuizQuestionsRouting;
  pairs: QuizPairsRouting;
}
