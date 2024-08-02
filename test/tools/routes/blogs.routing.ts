import { RouterPaths } from '../helpers/routing';

export class BlogsRouting {
  constructor(private readonly baseUrl = RouterPaths.blogger) {}
  uploadBlogBackgroundWallpaper = (blogId) =>
    `${this.baseUrl}/${blogId}/images/wallpaper`;
  uploadBlogMainImage = (blogId) => `${this.baseUrl}/${blogId}/images/main`;
  uploadPostMainImage = (blogId, postId) =>
    `${this.baseUrl}/${blogId}/posts/${postId}/images/main`;
  getAllCommentsForUserBlogs = () => `${this.baseUrl}/comments`;
  getBlogs = () => this.baseUrl;
  getBlog = (blogId) => `${this.baseUrl}/${blogId}`;
  getPosts = (blogId) => `${this.baseUrl}/${blogId}/posts`;
  updatePost = (blogId, postId) => `${this.baseUrl}/${blogId}/posts/${postId}`;
  createPost = (blogId) => `${this.baseUrl}/${blogId}/posts`;
  createBlog = () => this.baseUrl;
  updateBlog = (blogId) => `${this.baseUrl}/${blogId}`;
  deleteBlog = (blogId) => `${this.baseUrl}/${blogId}`;
  deletePost = (blogId, postId) => `${this.baseUrl}/${blogId}/posts/${postId}`;
  bindBlog = (blogId, userId) =>
    `${this.baseUrl}/${blogId}/bind-with-user/${userId}`;
  banUnban = (blogId) => `${this.baseUrl}/${blogId}/ban`;
}
