import { likesStatus } from '../../../../../domain/likes.types';
import { CommentReaction } from '../../../domain/entities/comment-reactions.entity';
import { Comment } from '../../../domain/entities/comment.entity';
import { CommentsViewModel } from './comments.view-model.type';

const convertStatus = (
  myReactions: CommentReaction[] | likesStatus,
  commentId: string,
): likesStatus => {
  if (Array.isArray(myReactions)) {
    if (!myReactions.length) return likesStatus.None;
    return (
      (myReactions
        .filter((r) => r.comment.id === commentId)
        .map((r) => r.reaction_type)
        .join('') as likesStatus) || likesStatus.None
    );
  }
  return myReactions || likesStatus.None;
};

export const getCommentsTORViewModel = (
  comment: Comment,
  myReactions: CommentReaction[] | likesStatus,
): CommentsViewModel => {
  return {
    id: comment.id,
    content: comment.content,
    commentatorInfo: {
      userId: comment.userAccount.id,
      userLogin: comment.user_login,
    },
    createdAt: comment.created_at.toISOString(),
    likesInfo: {
      likesCount: comment.commentReactionCounts?.likes_count || 0,
      dislikesCount: comment.commentReactionCounts?.dislikes_count || 0,
      myStatus: convertStatus(myReactions, comment.id),
    },
  };
};
