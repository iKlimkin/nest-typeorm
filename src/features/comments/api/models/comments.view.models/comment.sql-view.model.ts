import { likesStatus } from '../../../../../domain/likes.types';
import { CommentSqlDbType } from '../output.comment.models/output.comment.models';
import { CommentsViewModel } from './comments.view-model.type';

export const getCommentSqlViewModel = (
  comment: CommentSqlDbType,
  myStatus: likesStatus,
): CommentsViewModel => {
  return {
    id: comment.id,
    content: comment.content,
    commentatorInfo: {
      userId: comment.user_id,
      userLogin: comment.user_login,
    },
    createdAt: comment.created_at.toISOString(),
    likesInfo: {
      likesCount: comment.likes_count || 0,
      dislikesCount: comment.dislikes_count || 0,
      myStatus,
    },
  };
};
