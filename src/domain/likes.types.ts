export type OutputId = { id: string };

export type LikeUserType = {
  userId?: string;
  status: likesStatus;
};

export type UpdateReactionModelType = {
  postId: string;
  userId: string;
  inputStatus: likesStatus;
};

export type likeUserInfo = LikesCountType &
  LikeUserType & { commentId?: string; login?: string; postId?: string };

export enum likesStatus {
  None = 'None',
  Like = 'Like',
  Dislike = 'Dislike',
}

export type LikesUserInfoType = {
  userId: string;
  login: string;
  status: likesStatus;
  addedAt: string;
};

export type ReactionCommentType = {
  commentId: string;
  userId: string;
  inputStatus: LikeStatusType;
  currentStatus: LikeStatusType | null;
};

export type ReactionPostDtoType = Omit<ReactionPostCountType, 'currentStatus'>;

export type ReactionsCounter = {
  likesCount: number;
  dislikesCount: number;
};

export type ReactionCommentDto = Omit<ReactionCommentType, 'currentStatus'> &
  ReactionsCounter;

export type ReactionPostCountType = ReactionPostType & ReactionsCounter;

export type ReactionPostType = Omit<ReactionCommentType, 'commentId'> & {
  postId: string;
  userLogin: string;
};

export type LikeStatusType = keyof typeof likesStatus;

export type InputLikeStatus = {
  likeStatus: likesStatus;
};

export type LikesCountType = ReactionsCounter & {
  status?: likesStatus;
};

export abstract class ReactionsSqlCounter {
  likes_count: number;
  dislikes_count: number;
}
