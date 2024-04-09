import { BlogViewModelType } from './blog.view.model-type';
import { Blog } from '../../../domain/entities/blog.entity';

export const getBlogsViewModel = (
  blog: Blog,
): BlogViewModelType => ({
  id: blog.id,
  name: blog.title,
  description: blog.description,
  websiteUrl: blog.website_url,
  createdAt: blog.created_at.toISOString(),
  isMembership: blog.is_membership,
});
