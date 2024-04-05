import {
  LikeUserType,
  LikesCountType,
  ReactionsSqlCounter,
  likesStatus,
} from '../../../../../domain/likes.types';
import { UserPostReactionsType } from '../../../../posts/api/models/output.post.models/output.post.models';

export type CreateCommentType = Omit<
  CommentType,
  'likesCountInfo' | 'createdAt' | 'likesUserInfo'
>;

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
  user_login: string;
  created_at: Date;
  likes_count: number | null;
  dislikes_count: number | null;
  // reaction_type: likesStatus | null;
};

export type UserCommentReactionsType = Omit<
  UserPostReactionsType,
  'post_id'
> & { comment_id: string };

export class CommentReactionCounter extends ReactionsSqlCounter {
  dislikes_count: number;
  likes_count: number;
  comment_id: string;
}

export type CommentReactionsType = Pick<
  UserCommentReactionsType,
  'reaction_type'
> & { comment_id: string };

export type ReactionType = { reaction_type: likesStatus }[]
