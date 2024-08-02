const skip = true;
const run = false;

export const skipSettings = {
  run_all_tests: skip,

  quiz: skip,
  userAuth: skip,
  SAUsers: skip,
  posts: skip,
  appTests: skip,
  SABlogs: skip,
  bloggerBlogs: run,
  bloggerUsers: skip,
  blogs: skip,
  security: skip,
  app: skip,

  for(testName: e2eTestNamesEnum): boolean {
    if (!this.run_all_tests) return false;
    return this[testName] ?? skip;
  },

  enableTest(testName: e2eTestNamesEnum): void {
    this[testName] = true;
  },

  disableTest(testName: e2eTestNamesEnum): void {
    this[testName] = false;
  },

  toggleRunAllTests(): void {
    this.run_all_tests = !this.run_all_tests;
  },
};

export enum e2eTestNamesEnum {
  app = 'app',
  bloggerUsers = 'bloggerUsers',
  appTests = 'appTests',
  userAuth = 'userAuth',
  userAuthSql = 'userAuthSql',
  posts = 'posts',
  security = 'security',
  SAUsers = 'saUsers',
  blogs = 'blogs',
  bloggerBlogs = 'bloggerBlogs',
  SABlogs = 'SABlogs',
  staging = 'staging',
  quiz = 'quiz',
}

enum uTestNamesEnum {
  createPair = 'CreatePairUseCase',
}
