import { RouterPaths } from '../helpers/routing';

export class BloggerUsersRouting {
  constructor(private readonly baseUrl = RouterPaths.bloggerUsers) {}
  banUnbanRestriction = (userId) => `${this.baseUrl}/${userId}/ban`;
  getBannedUsersForBlog = (blogId) => `${this.baseUrl}/blog/${blogId}`
}
