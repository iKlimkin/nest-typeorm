import {
  likesStatus,
  ReactionsCounter,
} from '../../../../../domain/likes.types';
import {
  PostReactionCounter,
  PostsSqlDbType,
  UserPostReactionsType,
  UserReactionsOutType,
} from '../output.post.models/output.post.models';
import { PostViewModelType } from './post-view-model.type';

const calculateLikesDislikesCount = (
  reactionCounters: PostReactionCounter[],
  postId: string,
): ReactionsCounter => {
  const likesCount = +reactionCounters
    .map((counter) => (counter.post_id === postId ? counter.likes_count : 0))
    .filter(Number);

  const dislikesCount = +reactionCounters
    .map((counter) => (counter.post_id === postId ? counter.dislikes_count : 0))
    .filter(Number);

  return {
    likesCount: likesCount || 0,
    dislikesCount: dislikesCount || 0,
  };
};

const convertStatus = (
  myReactions: UserReactionsOutType[] | likesStatus,
  rawPost: PostsSqlDbType,
): likesStatus => {
  let result: likesStatus;

  if (Array.isArray(myReactions)) {
    if (!myReactions.length) return likesStatus.None
    result =
      myReactions
        .filter(r => r.post_id === rawPost.id)
        .map(
          (r) => r.post_id === rawPost.id
            ? r.reaction_type
            : likesStatus.None
        )
        .join('') as likesStatus || likesStatus.None;
  } else {
    result = myReactions as likesStatus || likesStatus.None;
  }

  return result;
};

const mapNewestLikes = (reactions, postId) => {
  return reactions
    .filter(reaction => reaction.post_id === postId)
    .slice(0, 3)
    .map(like => ({
      addedAt: like.liked_at.toISOString(),
      userId: like.user_id,
      login: like.user_login,
    }));
};

export const getPostSqlViewModel = (
  rawPost: PostsSqlDbType,
  userReactions: UserPostReactionsType[],
  reactionCounter: PostReactionCounter[],
  myReactions: UserReactionsOutType[] | likesStatus = [],
): PostViewModelType => {
  const { likesCount, dislikesCount } = calculateLikesDislikesCount(
    reactionCounter,
    rawPost.id,
  );

  return {
    id: rawPost.id,
    title: rawPost.title,
    shortDescription: rawPost.short_description,
    content: rawPost.content,
    blogId: rawPost.blog_id,
    blogName: rawPost.blog_title,
    createdAt: rawPost.created_at.toISOString(),
    extendedLikesInfo: {
      likesCount,
      dislikesCount,
      myStatus: convertStatus(myReactions, rawPost),
      newestLikes: mapNewestLikes(userReactions, rawPost.id),
    },
  };
};
