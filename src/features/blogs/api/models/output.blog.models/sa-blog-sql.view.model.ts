import { Blog } from '../../../domain/entities/blog.entity';
import { BlogsSqlDbType } from './blog.models';
import { SABlogViewModelType } from './blog.view.model-type';

export const getSABlogSqlViewModel = (
  blog: BlogsSqlDbType,
): SABlogViewModelType => ({
  id: blog.id,
  ownerInfo: {
    userId: blog.user_id ? blog.user_id : 'test'
  },
  name: blog.title,
  description: blog.description,
  websiteUrl: blog.website_url,
  createdAt: blog.created_at.toISOString(),
  isMembership: blog.is_membership,
});
