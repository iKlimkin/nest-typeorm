import {
  LikesStatuses,
  ReactionsCounter,
} from '../../../../../domain/reaction.models';
import {
  CommentReactionCounter,
  CommentReactionsType,
  CommentSqlDbType,
} from '../output.comment.models/comment.models';
import { CommentsViewModel } from './comments.view-model.type';

const calculateLikesDislikesCount = (
  reactionCounters: CommentReactionCounter[],
  commentId: string,
): ReactionsCounter => {
  const likesCount = +reactionCounters
    .map((counter) =>
      counter.comment_id === commentId ? counter.likes_count : 0,
    )
    .filter(Number);

  const dislikesCount = +reactionCounters
    .map((counter) =>
      counter.comment_id === commentId ? counter.dislikes_count : 0,
    )
    .filter(Number);

  return {
    likesCount: likesCount || 0,
    dislikesCount: dislikesCount || 0,
  };
};

const convertStatus = (
  myReactions: CommentReactionsType[] | LikesStatuses,
  commentId: string,
): LikesStatuses => {
  if (Array.isArray(myReactions)) {
    if (!myReactions.length) return LikesStatuses.None;
    return (
      (myReactions
        .filter((r) => r.comment_id === commentId)
        .map((r) => r.reaction_type)
        .join('') as LikesStatuses) || LikesStatuses.None
    );
  }
  return myReactions || LikesStatuses.None;
};

export const getCommentsSqlViewModel = (
  comment: CommentSqlDbType,
  reactionCounter: CommentReactionCounter[],
  myReactions: CommentReactionsType[] | LikesStatuses = [],
): CommentsViewModel => {
  const { likesCount, dislikesCount } = calculateLikesDislikesCount(
    reactionCounter,
    comment.id,
  );

  return {
    id: comment.id,
    content: comment.content,
    commentatorInfo: {
      userId: comment.user_id,
      userLogin: comment.user_login,
    },
    createdAt: comment.created_at.toISOString(),
    likesInfo: {
      likesCount,
      dislikesCount,
      myStatus: convertStatus(myReactions, comment.id),
    },
  };
};
