export const skipSettings = {
  run_all_tests: false,

  quiz: true,
  userAuth: true,
  sa: true,
  sa_blogs: true,
  userAuthSql: true,
  posts: false,
  appTests: true,
  blogs: true,
  security: true,
  app: true,
  staging: true,

  for(testName: TestsName): boolean {
    if (this.run_all_tests) return false;

    if (this[testName]) return this[testName];

    return false;
  },
};

enum TestsNames {
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

type TestsName = keyof typeof TestsNames;

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
