import { RouterPaths } from '../helpers/routing';

export class FeedbacksRouting {
  constructor(private readonly baseUrl = RouterPaths.comments) {}
  updateReaction = (commentId) => `${this.baseUrl}/${commentId}/like-status`;
  updateComment = (commentId) => `${this.baseUrl}/${commentId}`;
  deleteComment = (commentId) => `${this.baseUrl}/${commentId}`;
  getComment = (commentId) => `${this.baseUrl}/${commentId}`;
}
