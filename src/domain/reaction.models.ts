import { IsNotEmpty, IsUUID, IsEnum } from 'class-validator';

export type LikeUserType = {
  userId?: string;
  status: LikesStatuses;
};

export enum LikesStatuses {
  None = 'None',
  Like = 'Like',
  Dislike = 'Dislike',
}

export class PostReactionDto {
  @IsNotEmpty()
  @IsUUID()
  postId: string;

  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsNotEmpty()
  @IsEnum(LikesStatuses)
  inputStatus: LikesStatuses;
}

export type likeUserInfo = LikesCountType &
  LikeUserType & { commentId?: string; login?: string; postId?: string };

export type LikesUserInfoType = {
  userId: string;
  login: string;
  status: LikesStatuses;
  addedAt: string;
};

export type ReactionCommentType = {
  commentId: string;
  userId: string;
  inputStatus: LikeStatusType;
  currentStatus: LikeStatusType | null;
};

export type ReactionPostDto = Omit<ReactionPostCountType, 'currentStatus'>;

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

export type LikeStatusType = keyof typeof LikesStatuses;

export type InputLikeStatus = {
  likeStatus: LikesStatuses;
};

export type LikesCountType = ReactionsCounter & {
  status?: LikesStatuses;
};

// export abstract class ReactionsCounterUnderscore {
//   likes_count: number;
//   dislikes_count: number;
// }
