// import {
//   TemporaryUserAccount,
//   Comment,
//   Blog,
//   CommentReaction,
//   CommentReactionCounts,
//   Post,
//   PostReaction,
//   PostReactionCounts,
//   UserSession,
// } from '.';

import { TemporaryUserAccount } from '../features/auth/domain/entities/temp-account.entity';
import { UserSession } from '../features/auth/infrastructure/settings';
import { Blog } from '../features/blogs/domain/entities/blog.entity';
import { CommentReactionCounts } from '../features/comments/domain/entities/comment-reaction-counts.entity';
import { CommentReaction } from '../features/comments/domain/entities/comment-reactions.entity';
import { Comment } from '../features/comments/domain/entities/comment.entity';
import { PostReactionCounts } from '../features/posts/domain/entities/post-reaction-counts.entity';
import { PostReaction } from '../features/posts/domain/entities/post-reactions.entity';
import { Post } from '../features/posts/domain/entities/post.entity';

export const entities = [
  TemporaryUserAccount,
  Comment,
  Post,
  Blog,
  UserSession,
  PostReaction,
  PostReactionCounts,
  CommentReaction,
  CommentReactionCounts,
];
