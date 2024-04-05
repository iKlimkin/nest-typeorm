import { likesStatus } from '../../../../../domain/likes.types';
import { PostReaction } from '../../../domain/entities/post-reactions.entity';
import { Post } from '../../../domain/entities/post.entity';
import { PostViewModelType } from './post-view-model.type';

export class TransReaction extends Post {
  post_id: string;
}

const convertStatus = (
  myReactions: PostReaction[] | likesStatus,
  post: Post,
): likesStatus => {
  if (Array.isArray(myReactions)) {
    if (!myReactions.length) return likesStatus.None;
    return (
      (myReactions
        .filter((r) => r.post.id === post.id)
        .map((r) =>
          r.post.id === post.id ? r.reaction_type : likesStatus.None,
        )
        .join('') as likesStatus) || likesStatus.None
    );
  }

  return myReactions || likesStatus.None;
};

const filterNewestLikes = (reactions: PostReaction[], postId: string) => {
  return reactions
    .filter((reaction) => reaction.post.id === postId)
    .map((like) => ({
      addedAt: like.created_at.toISOString(),
      userId: like.user.id,
      login: like.user_login,
    }))
    .slice(0, 3);
};

export const getPostTORViewModel = (
  post: Post,
  latestReactions: PostReaction[],
  myReaction: likesStatus | PostReaction[],
): PostViewModelType => {
  return {
    id: post.id,
    title: post.title,
    shortDescription: post.short_description,
    content: post.content,
    blogId: post.blog.id,
    blogName: post.blog_title,
    createdAt: post.created_at.toISOString(),
    extendedLikesInfo: {
      likesCount: post.postReactionCounts?.likes_count || 0,
      dislikesCount: post.postReactionCounts?.dislikes_count || 0,
      myStatus: convertStatus(myReaction, post),
      newestLikes: filterNewestLikes(latestReactions, post.id),
    },
  };
};
