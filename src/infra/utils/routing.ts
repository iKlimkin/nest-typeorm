export type PathMappings = keyof typeof RouterPaths;
export type RouterPathsType = (typeof RouterPaths)[keyof typeof RouterPaths];
export const RouterPaths = {
  comments: '/comments',
  blogs: '/blogs',
  SABlogs: '/sa/blogs',
  blogger: '/blogger/blogs',
  bloggerUsers: '/blogger/users',
  posts: '/posts',
  users: '/sa/users',
  auth: '/auth',
  security: '/security/devices',
  quizQuestions: '/sa/quiz/questions',
  quiz: '/pair-game-quiz',
  integrations: {
    telegram: '/integrations/telegram',
    stripe: '/integrations/stripe',
  },

  test: '/testing/all-data',
};

export enum NavigationEnum {
  comments = '/comments',
  blogs = '/blogs',
  SABlogs = '/sa/blogs',
  posts = '/posts',
  users = '/sa/users',
  auth = '/auth',
  security = '/security/devices',
  quizQuestions = '/sa/quiz/questions',
  quizPairs = '/pair-game-quiz/pairs',
  quizUsers = '/pair-game-quiz/users',
  test = '/testing/all-data',
}
