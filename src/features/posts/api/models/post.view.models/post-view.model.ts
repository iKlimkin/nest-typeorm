import { LikesStatuses } from '../../../../../domain/reaction.models';
import { PostReaction } from '../../../domain/entities/post-reactions.entity';
import { Post } from '../../../domain/entities/post.entity';
import { PostViewModelType } from './post-view-model.type';

const convertStatus = (
  myReactions: PostReaction[] | LikesStatuses,
  post: Post,
): LikesStatuses => {
  if (Array.isArray(myReactions)) {
    if (!myReactions.length) return LikesStatuses.None;
    return (
      (myReactions
        .filter((r) => r.post.id === post.id)
        .map((r) =>
          r.post.id === post.id ? r.reactionType : LikesStatuses.None,
        )
        .join('') as LikesStatuses) || LikesStatuses.None
    );
  }

  return myReactions || LikesStatuses.None;
};

const filterNewestLikes = (reactions: PostReaction[], postId: string) => {
  return reactions
    .filter((reaction) => reaction.post.id === postId)
    .map((like) => ({
      addedAt: like.created_at.toISOString(),
      userId: like.user.id,
      login: like.userLogin,
    }))
    .slice(0, 3);
};

export const getPostViewModel = (
  post: Post,
  latestReactions: PostReaction[],
  myReaction: LikesStatuses | PostReaction[],
): PostViewModelType => {
  return {
    id: post.id,
    title: post.title,
    shortDescription: post.shortDescription,
    content: post.content,
    blogId: post.blogId || 'add relation',
    blogName: post.blogTitle,
    createdAt: post.created_at.toISOString(),
    extendedLikesInfo: {
      likesCount: post.postReactionCounts?.likes_count || 0,
      dislikesCount: post.postReactionCounts?.dislikes_count || 0,
      myStatus: convertStatus(myReaction, post),
      newestLikes: filterNewestLikes(latestReactions, post.id),
    },
  };
};
