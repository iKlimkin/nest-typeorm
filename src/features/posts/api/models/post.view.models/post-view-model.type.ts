import { LikesStatuses } from '../../../../../domain/reaction.models';
import { Post } from '../../../domain/entities/post.entity';

export type PostStatusInfo = {
  addedAt: string;
  userId: string;
  login: string;
};

export type PostViewModelType = {
  /**
   * id of the existing post
   */
  id: string;

  /**
   *  post's title
   */
  title: string;

  /**
   * shortDescription of the post
   */
  shortDescription: string;

  /**
   * content of existing post
   */
  content: string;

  /**
   * Post's id
   */
  blogId: string;

  /**
   * Post's name
   */
  blogName: string;

  /**
   * post creation date
   */
  createdAt: string;

  extendedLikesInfo: {
    likesCount: number;

    dislikesCount: number;

    myStatus: LikesStatuses;

    newestLikes: PostStatusInfo[] | [];
  };
};

export interface PostWithNewestLikes extends Omit<Post, 'postReactionCounts'> {
  newestLikes: PostStatusInfo[] | null;
  postReactionCounts: {
    likesCount: number;
    dislikesCount: number;
  };
}

export interface PostWithNewestLikesRaw {
  id: string;
  createdAt: Date;
  shortDescription: string;
  title: string;
  content: string;
  blogTitle: string;
  blogId: string;
  newestLikes: PostStatusInfo[] | null;
  myReaction?: LikesStatuses.Like | LikesStatuses.Dislike;
  likesCount: number | null;
  dislikesCount: number | null;
}
