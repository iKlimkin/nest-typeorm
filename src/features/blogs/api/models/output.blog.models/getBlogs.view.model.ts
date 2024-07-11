import { BlogViewModelType, SABlogsViewType } from './blog.view.model-type';
import { Blog } from '../../../domain/entities/blog.entity';

export const getBlogsViewModel = (blog: Blog): BlogViewModelType => ({
  id: blog.id,
  name: blog.title,
  description: blog.description,
  websiteUrl: blog.websiteUrl,
  createdAt: blog.created_at.toISOString(),
  isMembership: blog.isMembership,
});

// export const getSABlogsViewModel = (blog: Blog): SABlogsViewType => ({
//   id: blog.id,
//   name: blog.title,
//   description: blog.description,
//   websiteUrl: blog.websiteUrl,
//   createdAt: blog.created_at.toISOString(),
//   isMembership: blog.isMembership,
//   blogOwnerInfo: {
//     userId: blog.user?.id,
//     userLogin: blog.user?.login,
//   },
// });

export const getSABlogsViewModelFromRaw = (
  rawBlog: IRawBlog,
): SABlogsViewType => ({
  id: rawBlog.blogs_id,
  name: rawBlog.blogs_title,
  description: rawBlog.blogs_description,
  websiteUrl: rawBlog.blogs_websiteUrl,
  createdAt: rawBlog.blogs_created_at.toISOString(),
  isMembership: rawBlog.blogs_isMembership,
  blogOwnerInfo: {
    userId: rawBlog?.user_id,
    userLogin: rawBlog?.user_login,
  },
});

interface IRawBlog {
  blogs_id: string;
  blogs_created_at: Date;
  blogs_title: string;
  blogs_description: string;
  blogs_websiteUrl: string;
  blogs_isMembership: boolean;
  blogs_ownerId: string;
  user_id?: string;
  user_login?: string;
}
