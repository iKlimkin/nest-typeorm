export type UpdatePostModel = {
  /**
   * post's name
   */
  title: string;

  /**
   * short description of the post
   */
  shortDescription: string;

  /**
   * content of existing post
   */
  content: string;

  /**
   * blog's id of updating post
   */
  blogId: string;
};
