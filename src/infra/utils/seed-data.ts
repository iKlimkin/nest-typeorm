import { DataSource } from 'typeorm';
import { UserAccount } from '../../features/admin/domain/entities/user-account.entity';
import { Blog } from '../../features/blogs/domain/entities/blog.entity';
import { CommentReactionCounts } from '../../features/comments/domain/entities/comment-reaction-counts.entity';
import { CommentReaction } from '../../features/comments/domain/entities/comment-reactions.entity';
import { PostReactionCounts } from '../../features/posts/domain/entities/post-reaction-counts.entity';
import { PostReaction } from '../../features/posts/domain/entities/post-reactions.entity';
import { Post } from '../../features/posts/domain/entities/post.entity';
import { LikesStatuses } from '../../domain/reaction.models';
import { Comment } from '../../features/comments/domain/entities/comment.entity';

export async function seedAllData(dataSource: DataSource) {
  try {
    const userRepo = dataSource.getRepository('UserAccount');
    const usersCount = await userRepo.count();

    if (!usersCount) {
      await seedUsers(dataSource);
      await seedBlogs(dataSource);
      await seedPosts(dataSource);
      await seedPostReactions(dataSource);
      await seedPostReactionCounts(dataSource);
      await seedComments(dataSource);

      console.log('Successfully seeded data');
    }
  } catch (error) {
    console.log(error);
  }
}

const seedUsers = async (dataSource: DataSource) => {
  const userRepo = dataSource.getRepository('UserAccount');

  const expirationDate = new Date();
  expirationDate.setMinutes(expirationDate.getMinutes() + 30);

  const user1 = new UserAccount();
  user1.login = 'login';
  user1.email = 'email@example.com';
  user1.password_salt = 'salt';
  user1.password_hash = 'hash';
  user1.confirmation_code = '123';
  user1.confirmation_expiration_date = expirationDate;
  user1.is_confirmed = true;

  const user2 = new UserAccount();
  user2.login = 'user2';
  user2.email = 'user2@example.com';
  user2.password_salt = 'salt2';
  user2.password_hash = 'hash2';
  user2.confirmation_code = '1234';
  user2.confirmation_expiration_date = expirationDate;
  user2.is_confirmed = true;

  const user3 = new UserAccount();
  user3.login = 'user3';
  user3.email = 'user3@example.com';
  user3.password_salt = 'salt3';
  user3.password_hash = 'hash3';
  user3.confirmation_code = '12345';
  user3.confirmation_expiration_date = expirationDate;
  user3.is_confirmed = true;

  const user4 = new UserAccount();
  user4.login = 'login_user4';
  user4.email = 'user4@example.com';
  user4.password_salt = 'salt4';
  user4.password_hash = 'hash4';
  user4.confirmation_code = '123456';
  user4.confirmation_expiration_date = expirationDate;
  user4.is_confirmed = true;

  const user5 = new UserAccount();
  user5.login = 'login_user5';
  user5.email = 'user5@example.com';
  user5.password_salt = 'salt5';
  user5.password_hash = 'hash5';
  user5.confirmation_code = '123556';
  user5.confirmation_expiration_date = expirationDate;
  user5.is_confirmed = true;

  await userRepo.save([user1, user2, user3, user4, user5]);
};

const seedBlogs = async (dataSource: DataSource) => {
  const blogRepo = dataSource.getRepository('Blog');
  const numberOfBlogs = 10;
  const batchSize = 10;

  for (let i = 1; i <= numberOfBlogs; i += batchSize) {
    const batchBlogs = [];
    const doPush = Array.prototype.push.bind(batchBlogs);

    for (let j = i; j < i + batchSize && j <= numberOfBlogs; j++) {
      const blog = new Blog();
      blog.title = `Blog ${j}`;
      blog.description = `Description for Blog${j}`;
      blog.website_url = `https://example${j}.com/blog${j}`;
      blog.is_membership = false;

      doPush(blog);
    }

    await blogRepo.save(batchBlogs);
  }
};

const seedPosts = async (dataSource: DataSource) => {
  const postRepo = dataSource.getRepository('Post');
  const blogRepo = dataSource.getRepository('Blog');

  const blog1 = (await blogRepo.find())[0];
  const blog2 = (await blogRepo.find())[1];
  const blog3 = (await blogRepo.find())[2];
  const blog4 = (await blogRepo.find())[3];
  const blog5 = (await blogRepo.find())[4];

  const post1 = new Post();
  post1.blog_title = blog1.title;
  post1.content = 'content 1';
  post1.title = 'title by post 1';
  post1.short_description = 'short description by post 1';
  post1.blog = blog1.id;

  const post2 = new Post();
  post2.blog_title = blog1.title;
  post2.content = 'content 2';
  post2.title = 'title by post 2';
  post2.short_description = 'short description by post 2';
  post2.blog = blog1.id;

  const post4 = new Post();
  post4.blog_title = blog2.title;
  post4.content = 'content 2';
  post4.title = 'title by post 2';
  post4.short_description = 'short description by post 2';
  post4.blog = blog2.id;

  const post5 = new Post();
  post5.blog_title = blog3.title;
  post5.content = 'content 2';
  post5.title = 'title by post 2';
  post5.short_description = 'short description by post 2';
  post5.blog = blog3.id;

  const post6 = new Post();
  post6.blog_title = blog1.title;
  post6.content = 'content 2';
  post6.title = 'title by post 2';
  post6.short_description = 'short description by post 2';
  post6.blog = blog3.id;

  const post7 = new Post();
  post7.blog_title = blog4.title;
  post7.content = 'content 2';
  post7.title = 'title by post 2';
  post7.short_description = 'short description by post 2';
  post7.blog = blog4.id;

  const post8 = new Post();
  post8.blog_title = blog5.title;
  post8.content = 'content 2';
  post8.title = 'title by post 2';
  post8.short_description = 'short description by post 2';
  post8.blog = blog5.id;

  await postRepo.save([post1, post2, post4, post5, post6, post7, post8]);
};
const seedPostReactions = async (dataSource: DataSource) => {
  const postRepo = dataSource.getRepository('Post');
  const userRepo = dataSource.getRepository('UserAccount');
  const reactionRepo = dataSource.getRepository('PostReaction');

  const post1 = (await postRepo.find())[0];
  const user1 = (await userRepo.find())[0];
  const user2 = (await userRepo.find())[1];
  const user3 = (await userRepo.find())[2];
  const user4 = (await userRepo.find())[3];
  const user5 = (await userRepo.find())[4];

  const reaction1 = new PostReaction();
  reaction1.post = post1.id;
  reaction1.reaction_type = LikesStatuses.Like;
  reaction1.user = user1.id;
  reaction1.user_login = user1.login;

  const reaction2 = new PostReaction();
  reaction2.post = post1.id;
  reaction2.reaction_type = LikesStatuses.Like;
  reaction2.user = user2.id;
  reaction2.user_login = user2.login;

  const reaction3 = new PostReaction();
  reaction3.post = post1.id;
  reaction3.reaction_type = LikesStatuses.Like;
  reaction3.user = user3.id;
  reaction3.user_login = user3.login;

  const reaction4 = new PostReaction();
  reaction4.post = post1.id;
  reaction4.reaction_type = LikesStatuses.Dislike;
  reaction4.user = user4.id;
  reaction4.user_login = user4.login;

  const reaction5 = new PostReaction();
  reaction5.post = post1.id;
  reaction5.reaction_type = LikesStatuses.Like;
  reaction5.user = user5.id;
  reaction5.user_login = user5.login;

  await reactionRepo.save([
    reaction1,
    reaction2,
    reaction3,
    reaction4,
    reaction5,
  ]);
};

const seedPostReactionCounts = async (dataSource: DataSource) => {
  const postRepo = dataSource.getRepository('Post');
  const postReactionCounts = dataSource.getRepository('PostReactionCounts');

  const post = (await postRepo.find())[0];

  const reactionCount = new PostReactionCounts();
  reactionCount.post = post.id;
  reactionCount.dislikes_count = 1;
  reactionCount.likes_count = 4;

  await postReactionCounts.save(reactionCount);
};

const seedComments = async (dataSource: DataSource) => {
  const postRepo = dataSource.getRepository('Post');
  const commentReactions = dataSource.getRepository('CommentReaction');
  const commentReactionCounts = dataSource.getRepository(
    'CommentReactionCounts'
  );
  const commentRepo = dataSource.getRepository('Comment');
  const userRepo = dataSource.getRepository('UserAccount');

  const post = (await postRepo.find())[0];
  const user1 = (await userRepo.find())[0];
  const user2 = (await userRepo.find())[1];
  const user3 = (await userRepo.find())[2];
  const user4 = (await userRepo.find())[3];
  const user5 = (await userRepo.find())[4];

  const comment1 = new Comment();
  comment1.content = 'content1';
  comment1.post = post.id;
  comment1.userLogin = user1.login;
  comment1.user = user1.id;

  await commentRepo.save(comment1);

  const commentReaction1 = new CommentReaction();
  commentReaction1.comment = comment1;
  commentReaction1.reaction_type = LikesStatuses.Like;
  commentReaction1.userAccount = user1.id;

  const commentReaction2 = new CommentReaction();
  commentReaction2.comment = comment1;
  commentReaction2.reaction_type = LikesStatuses.Like;
  commentReaction2.userAccount = user2.id;

  const commentReaction3 = new CommentReaction();
  commentReaction3.comment = comment1;
  commentReaction3.reaction_type = LikesStatuses.Like;
  commentReaction3.userAccount = user3.id;

  const commentReaction4 = new CommentReaction();
  commentReaction4.comment = comment1;
  commentReaction4.reaction_type = LikesStatuses.Dislike;
  commentReaction4.userAccount = user4.id;

  const commentReaction5 = new CommentReaction();
  commentReaction5.comment = comment1;
  commentReaction5.reaction_type = LikesStatuses.Like;
  commentReaction5.userAccount = user5.id;

  await commentReactions.save([
    commentReaction1,
    commentReaction2,
    commentReaction3,
    commentReaction4,
    commentReaction5,
  ]);

  const reactionCommentCount = new CommentReactionCounts();
  reactionCommentCount.comment = comment1;
  reactionCommentCount.dislikes_count = 1;
  reactionCommentCount.likes_count = 4;

  await commentReactionCounts.save(reactionCommentCount);
};
