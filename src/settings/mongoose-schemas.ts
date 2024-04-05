import {
  UserAccount,
  UserAccountSchema,
} from '../features/admin/domain/entities/userAccount.schema';
import {
  TempUserAccount,
  TempUserAccountSchema,
} from '../features/auth/domain/entities/temp-account.schema';
import {
  Blog,
  BlogSchema,
} from '../features/blogs/domain/entities/blog.schema';
import {
  CommentSchema,
  Comment,
} from '../features/comments/domain/entities/comment.schema';
import {
  PostSchema,
  Post,
} from '../features/posts/domain/entities/posts.schema';
import {
  Security,
  SecuritySchema,
} from '../features/security/domain/entities/security.schema';
import {
  RequestCounter,
  ApiRequestCounterSchema,
} from '../infra/logging/domain/entities/api-request.schema';

export const mongooseSchemas = [
  {
    name: Blog.name,
    schema: BlogSchema,
  },
  {
    name: Post.name,
    schema: PostSchema,
  },
  {
    name: UserAccount.name,
    schema: UserAccountSchema,
  },
  {
    name: Comment.name,
    schema: CommentSchema,
  },
  {
    name: Security.name,
    schema: SecuritySchema,
  },
  {
    name: TempUserAccount.name,
    schema: TempUserAccountSchema,
  },
  {
    name: RequestCounter.name,
    schema: ApiRequestCounterSchema,
  },
];
