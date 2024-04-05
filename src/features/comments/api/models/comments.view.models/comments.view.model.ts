import { likesStatus } from '../../../../../domain/likes.types';
import { getLikeStatus } from '../../../../../infra/utils/get-like-status';
import { CommentType } from '../output.comment.models/output.comment.models';
import { CommentsViewModel } from './comments.view-model.type';
import { WithId } from 'mongodb';

export type CommentDBType = WithId<CommentType>;

export const getCommentsViewModel = (
  comment: CommentDBType,
  userId?: string,
): CommentsViewModel => {
  const [status] = getLikeStatus(comment.likesUserInfo, userId);
  return {
    id: comment._id.toString(),
    content: comment.content,
    commentatorInfo: {
      userId: comment.commentatorInfo.userId,
      userLogin: comment.commentatorInfo.userLogin,
    },
    createdAt: comment.createdAt,
    likesInfo: {
      likesCount: comment.likesCountInfo.likesCount,
      dislikesCount: comment.likesCountInfo.dislikesCount,
      myStatus: status || likesStatus.None,
    },
  };
};
