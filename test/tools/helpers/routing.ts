export type PathMappings = keyof typeof RouterPaths;

export const RouterPaths = {
  comments: '/comments',
  blogs: '/blogs',
  sa_blogs: '/sa/blogs',
  posts: '/posts',
  users: '/sa/users',
  auth: '/auth',
  security: '/security/devices',
  quiz: 'sa/quiz/questions',

  test: '/testing/all-data',
};
