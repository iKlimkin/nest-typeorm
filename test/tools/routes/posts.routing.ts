import { RouterPaths } from '../helpers/routing';

export class PostsRouting {
  constructor(private readonly baseUrl = RouterPaths.posts) {}
  updateReaction = (postId) => `${this.baseUrl}/${postId}/like-status`;
  getComments = (postId) => `${this.baseUrl}/${postId}/comments`;
  createComment = (postId) => `${this.baseUrl}/${postId}/comments`;
  getPost = (postId) => `${this.baseUrl}/${postId}`;
  getPosts = () => this.baseUrl;
}
