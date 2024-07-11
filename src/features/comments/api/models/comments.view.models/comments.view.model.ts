import { LikesStatuses } from '../../../../../domain/reaction.models';
import { CommentReaction } from '../../../domain/entities/comment-reactions.entity';
import { Comment } from '../../../domain/entities/comment.entity';
import { CommentsViewModel } from './comments.view-model.type';

const convertStatus = (
  myReactions: CommentReaction[] | LikesStatuses,
  commentId: string,
): LikesStatuses => {
  if (Array.isArray(myReactions)) {
    if (!myReactions.length) return LikesStatuses.None;
    return (
      (myReactions
        .filter((r) => r.comment.id === commentId)
        .map((r) => r.reactionType)
        .join('') as LikesStatuses) || LikesStatuses.None
    );
  }
  return myReactions || LikesStatuses.None;
};

export const getCommentsViewModel = (
  comment: Comment,
  myReactions: CommentReaction[] | LikesStatuses,
): CommentsViewModel => ({
  id: comment.id,
  content: comment.content,
  commentatorInfo: {
    userId: comment.user.id,
    userLogin: comment.userLogin,
  },
  createdAt: comment.created_at.toISOString(),
  likesInfo: {
    likesCount: comment.commentReactionCounts?.likes_count || 0,
    dislikesCount: comment.commentReactionCounts?.dislikes_count || 0,
    myStatus: convertStatus(myReactions, comment.id),
  },
});
