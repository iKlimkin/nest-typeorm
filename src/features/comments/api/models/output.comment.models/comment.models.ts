import {
  LikeUserType,
  LikesCountType,
  LikesStatuses,
  ReactionsCounterRaw,
} from '../../../../../domain/reaction.models';
import { UserPostReactionsRawType } from '../../../../posts/api/models/output.post.models/output.post.models';

export type CreateCommentType = Omit<
  CommentType,
  'likesCountInfo' | 'createdAt' | 'likesUserInfo'
>;

export type CreateCommentDtoType = {
  postId: string;
  userId: string;
  login: string;
  content: string;
};

export type CommentType = {
  /**
   *  current content
   */
  content: string;

  /**
   * post's id to create a comment
   */
  postId: string;

  /**
   * info about commentator
   */
  commentatorInfo: {
    /**
     * user's id
     */
    userId: string;

    /**
     * user's login
     */
    userLogin: string;
  };

  /**
   * comment's create date
   */
  createdAt: string;

  likesUserInfo: LikeUserType[];

  likesCountInfo: LikesCountType;
};

export type CommentSqlDbType = {
  id: string;
  content: string;
  user_id: string;
  userLogin: string;
  created_at: Date;
  likes_count: number | null;
  dislikes_count: number | null;
};

export type UserCommentReactionsRawType = Omit<
  UserPostReactionsRawType,
  'post_id'
> & { comment_id: string };

export class CommentReactionRawCounter extends ReactionsCounterRaw {
  dislikes_count: number;
  likes_count: number;
  comment_id: string;
}

export type CommentReactionsRawType = Pick<
  UserCommentReactionsRawType,
  'reactionType'
> & { comment_id: string };

export type ReactionType = { reactionType: LikesStatuses }[];
