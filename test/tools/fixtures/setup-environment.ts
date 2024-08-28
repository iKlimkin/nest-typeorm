import { CommentsViewModel } from '../../../src/features/comments/api/controllers';
import { PostViewModelType } from '../../../src/features/posts/api/models/post.view.models/post-view-model.type';
import { BloggerBlogsTestManager } from '../managers/BlogsTestManager';
import { PostsTestManager } from '../managers/PostsTestManager';
import { UsersTestManager } from '../managers/UsersTestManager';

interface PrepareTestOptions {
  users?: { quantity?: number };
  blogs?: { quantity?: number } | boolean;
  posts?: { quantity?: number } | boolean;
  comments?: { quantity?: number } | boolean;
}
const defaultOptions = {
  users: { quantity: 3 },
  blogs: { prepare: false, quantity: 2 },
  posts: { prepare: false, quantity: 3 },
  comments: { prepare: false, quantity: 2 },
};

const resolveOption = (
  option: { quantity?: number } | boolean,
  defaultOption: { prepare: boolean; quantity: number },
) => {
  if (typeof option === 'boolean') {
    return { ...defaultOption, prepare: option };
  }
  return {
    prepare: option?.quantity !== undefined,
    quantity: option?.quantity ?? defaultOption.quantity,
  };
};

export const configureTestSetup = async (
  testManagers: () => {
    usersTestManager: UsersTestManager;
    bloggerTestManager?: BloggerBlogsTestManager;
    postsTestManager?: PostsTestManager;
  },
  options: PrepareTestOptions = {},
) => {
  if (!testManagers) throw new Error('No test managers provided');

  const finalOptions = {
    users: { ...defaultOptions.users, ...options.users },
    blogs: resolveOption(options.blogs, defaultOptions.blogs),
    posts: resolveOption(options.posts, defaultOptions.posts),
    comments: resolveOption(options.comments, defaultOptions.comments),
  };

  const { users, blogs, posts, comments } = finalOptions;

  await createUsers(testManagers().usersTestManager, users.quantity);

  if (blogs.prepare) {
    await createBlogs(testManagers().bloggerTestManager, blogs.quantity);
  }

  if (posts.prepare && blogs.prepare) {
    await createBlogPosts(testManagers().bloggerTestManager, posts.quantity);
  } else if (posts.prepare && !blogs.prepare) {
    if (!(testManagers().bloggerTestManager instanceof BloggerBlogsTestManager))
      throw new Error('No blogger manager provided');

    await createBlogs(testManagers().bloggerTestManager, blogs.quantity);
    await createBlogPosts(testManagers().bloggerTestManager, posts.quantity);
  } else if (comments.prepare) {
    await createBlogs(testManagers().bloggerTestManager, blogs.quantity);
    await createBlogPosts(testManagers().bloggerTestManager, posts.quantity);
    if (!(testManagers().postsTestManager instanceof PostsTestManager))
      throw new Error('No posts test manager provided');
    await createPostComments(
      testManagers().postsTestManager,
      comments.quantity,
    );
  }
};

const createUsers = async (manager: UsersTestManager, userQuantity: number) => {
  const { accessTokens, users } = await manager.createUsers(userQuantity);

  const [firstPlayerToken, secondPlayerToken, thirdPlayerToken] = accessTokens;

  expect.setState({
    accessTokens,
    firstPlayerToken,
    secondPlayerToken,
    thirdPlayerToken,
    users,
  });
};
const createBlogs = async (
  manager: BloggerBlogsTestManager,
  blogsQuantity: number,
) => {
  const { firstPlayerToken, secondPlayerToken } = expect.getState();

  const blogs = await manager.createBlogsForFurtherTests(
    [firstPlayerToken, secondPlayerToken],
    blogsQuantity,
  );

  const [blogByFirstToken, blogBySecondToken] = blogs;
  expect.setState({ blogs, blogByFirstToken, blogBySecondToken });
};

const createBlogPosts = async (
  manager: BloggerBlogsTestManager,
  postsQuantity: number,
) => {
  const {
    firstPlayerToken,
    secondPlayerToken,
    blogByFirstToken,
    blogBySecondToken,
  } = expect.getState();
  const tokens = [firstPlayerToken, secondPlayerToken];
  const blogs = [blogByFirstToken, blogBySecondToken];

  let allPosts: PostViewModelType[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const posts = await manager.createPosts(
      tokens[i],
      blogs[i].id,
      postsQuantity,
    );
    allPosts = allPosts.concat(posts);
  }

  const postByFirstToken = allPosts.filter(
    (post) => post.blogId === blogByFirstToken.id,
  )[0];
  const postBySecondToken = allPosts.filter(
    (post) => post.blogId === blogBySecondToken.id,
  )[0];

  expect.setState({
    posts: allPosts,
    postByFirstToken,
    postBySecondToken,
  });
};
const createPostComments = async (
  manager: PostsTestManager,
  commentsQuantity: number,
) => {
  const {
    firstPlayerToken,
    secondPlayerToken,
    postByFirstToken,
    postBySecondToken,
    users,
  } = expect.getState();
  const tokens = [firstPlayerToken, secondPlayerToken];
  const posts = [postByFirstToken, postBySecondToken];

  let allComments: CommentsViewModel[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const postId = posts[i].id;

    const comment = await manager.createComments(
      tokens[i],
      postId,
      commentsQuantity,
    );
    allComments = allComments.concat(comment);
  }

  const commentByFirstToken = allComments.filter(
    (comment) => comment.commentatorInfo.userId === users[0].id,
  )[0];
  const commentBySecondToken = allComments.filter(
    (comment) => comment.commentatorInfo.userId === users[1].id,
  )[0];

  expect.setState({
    comments: allComments,
    commentByFirstToken,
    commentBySecondToken,
  });
};
