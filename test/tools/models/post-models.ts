import { PostViewModelType } from '../../../src/features/posts/api/models/post.view.models/post-view-model.type';

export const postConstants = {
  postEqualTo: {
    id: expect.any(String),
    title: expect.any(String),
    shortDescription: expect.any(String),
    content: expect.any(String),
    blogId: expect.any(String),
    blogName: expect.any(String),
    createdAt: expect.any(String),
    extendedLikesInfo: {
      dislikesCount: expect.any(Number),
      likesCount: expect.any(Number),
      myStatus: expect.any(String),
      newestLikes: expect.any(Array),
    },
  } as PostViewModelType,

  postValidationErrors: {
    errorsMessages: expect.arrayContaining([
      { message: expect.any(String), field: 'title' },
      { message: expect.any(String), field: 'shortDescription' },
      { message: expect.any(String), field: 'content' },
      { message: expect.any(String), field: 'blogId' },
    ]),
  },
};
