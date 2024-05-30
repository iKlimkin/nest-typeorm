const skip = true;
const run = false;

export const skipSettings = {
  run_all_tests: skip,

  quiz: run,
  userAuth: skip,
  sa: skip,
  sa_blogs: skip,
  userAuthSql: skip,
  posts: skip,
  appTests: skip,
  blogs: skip,
  security: skip,
  app: skip,
  staging: skip,

  for(testName: TestNamesE2E): boolean {
    if (!this.run_all_tests) return run;
    return this[testName] ?? skip;
  },
};

enum e2eTestNamesEnum {
  app = 'app',
  appTests = 'appTests',
  userAuth = 'userAuth',
  userAuthSql = 'userAuthSql',
  posts = 'posts',
  blogs = 'blogs',
  security = 'security',
  sa = 'sa',
  sa_blogs = 'sa_blogs',
  staging = 'staging',
  quiz = 'quiz',
}

type TestNamesE2E = keyof typeof e2eTestNamesEnum;

enum uTestNamesEnum {
  createPair = 'CreatePairUseCase',
}

type uTestNames = keyof typeof uTestNamesEnum;
// export const skipDescribeSettings = {
//   run_all_tests: false,

//   userAuth: true,
//   sa: true,
//   sa_blogs: false,
//   userAuthSql: true,
//   posts: true,
//   appTests: true,
//   blogs: true,
//   security: true,

//   for(testName: TestsName): boolean {
//     if (this.run_all_tests) {
//       return false;
//     }

//     if (typeof this[testName] === 'boolean') {
//       return this[testName];
//     }

//     return false;
//   },
// };

// enum DescribeNames {
//   testing_create_blog = 'appTests',
//   userAuth = 'userAuth',
//   userAuthSql = 'userAuthSql',
//   posts = 'posts',
//   blogs = 'blogs',
//   security = 'security',
//   sa = 'sa',
//   sa_blogs = 'sa_blogs',
// }

// type SkipTitles = keyof typeof DescribeNames;
