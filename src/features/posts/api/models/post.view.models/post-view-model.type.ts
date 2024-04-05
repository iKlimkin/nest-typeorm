import { likesStatus } from '../../../../../domain/likes.types';

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

    myStatus: likesStatus;

    newestLikes: PostStatusInfo[] | [];
  };
};
