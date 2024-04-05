export type UpdateBlogModel = {
  /**
   * blog's name
   */
  name: string;

  /**
   * description of the blog
   */
  description: string;

  /**
   * websiteUrl of existing blog
   */
  websiteUrl: string;
};

export type UpdateBlogCommandType = UpdateBlogModel & {
  blogId: string;
};

