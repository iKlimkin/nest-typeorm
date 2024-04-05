import { likesStatus } from '../../../../../domain/likes.types';

export type CommentsViewModel = {
  /**
   * id of the existing blog
   */
  id: string;

  /**
   *  current content
   */
  content: string;

  /**
   * info about commentator
   */
  commentatorInfo: {
    /**
     * user's id
     */
    userId: string;

    /**
     * user's login
     */
    userLogin: string;
  };

  /**
   * comment's create date
   */
  createdAt: string;

  likesInfo: {
    likesCount: number;

    dislikesCount: number;

    myStatus: likesStatus;
  };
};
