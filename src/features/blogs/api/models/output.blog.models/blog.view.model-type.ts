export type BlogViewModelType = {
  /**
   * id of the existing blog
   */
  id: string;

  /**
   *  blog's name
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

  /**
   * blog is created
   */
  createdAt: string;

  /**
   * is a member of the blog
   */
  isMembership: boolean;
};

type OwnerBlogInfo = { userId: string }

export type SABlogViewModelType = BlogViewModelType & { ownerInfo: OwnerBlogInfo }