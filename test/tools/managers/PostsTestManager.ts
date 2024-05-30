import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import {
  LikeStatusType,
  LikesStatuses,
} from '../../../src/domain/reaction.models';
import { CreatePostModel } from '../../../src/features/posts/api/models/input.posts.models/create.post.model';
import { PostViewModelType } from '../../../src/features/posts/api/models/post.view.models/post-view-model.type';
import { RouterPaths } from '../helpers/routing';
import { SAViewType } from '../../../src/features/admin/api/models/userAdmin.view.models/userAdmin.view.model';
import { CommentsViewModel } from '../../../src/features/comments/api/models/comments.view.models/comments.view-model.type';

type CreationCommentData = {
  user: SAViewType;
  token: string;
  post: PostViewModelType;
};

export class PostsTestManager {
  constructor(protected readonly app: INestApplication) {}
  private application = this.app.getHttpServer();

  createInputData(field?: CreatePostModel | any): CreatePostModel {
    if (!field) {
      return {
        title: '',
        content: '',
        shortDescription: '',
        blogId: '',
      };
    } else {
      return {
        title: field.title || 'About stoic quotes ',
        content: field.content || 'https://en.wikipedia.org',
        shortDescription: field.shortDescription || 'Stoic philosophers',
        blogId: field.blogId || '',
      };
    }
  }

  checkPostsBeforeTests = async () =>
    await request(this.application)
      .get(RouterPaths.posts)
      .auth('admin', 'qwerty', { type: 'basic' })
      .expect(HttpStatus.CREATED, {
        pagesCount: 0,
        page: 1,
        pageSize: 10,
        totalCount: 0,
        items: [],
      });

  async createPost(
    inputData: CreatePostModel,
    expectedStatus: number = HttpStatus.CREATED,
  ): Promise<PostViewModelType> {
    const res = await request(this.application)
      .post(RouterPaths.posts)
      .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
      .send(inputData)
      .expect(expectedStatus);

    return res.body;
  }

  async createComment(
    inputData: CreationCommentData,
    content: string,
    expectedStatus: number = HttpStatus.CREATED,
  ): Promise<{ comment: CommentsViewModel }> {
    const response = await request(this.application)
      .post(`${RouterPaths.posts}/${inputData.post.id}/comments`)
      .auth(inputData.token, { type: 'bearer' })
      .send({ content })
      .expect(expectedStatus);

    if (response.status === HttpStatus.CREATED) {
      expect(response.body).toEqual({
        id: expect.any(String),
        content: content,
        commentatorInfo: {
          userId: inputData.user.id,
          userLogin: inputData.user.login,
        },
        createdAt: expect.any(String),
        likesInfo: {
          likesCount: 0,
          dislikesCount: 0,
          myStatus: LikesStatuses.None,
        },
      } as CommentsViewModel);
    }
    const comment = response.body;

    return { comment };
  }

  async updatePost(
    inputData: CreatePostModel,
    postId: string,
    expectStatus: number = HttpStatus.NO_CONTENT,
  ) {
    return await request(this.application)
      .put(`${RouterPaths.posts}/${postId}`)
      .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
      .send(inputData)
      .expect(expectStatus);
  }

  async getPosts() {
    await request(this.application).get('/posts').expect(HttpStatus.OK);
  }

  async getPostById(
    postId: string,
    token?: string | null,
    status: LikeStatusType = LikesStatuses.None,
    expectStatus: number = HttpStatus.OK,
  ) {
    const response = await request(this.application)
      .get(`${RouterPaths.posts}/${postId}`)
      .auth(token || 'any', { type: 'bearer' })
      .expect(expectStatus);

    const post: PostViewModelType = response.body;

    expect(post.extendedLikesInfo.myStatus).toBe(status);

    return post;
  }

  async likeStatusOperations(
    postId: string | PostViewModelType[],
    token: string,
    status: LikeStatusType | string = LikesStatuses.None,
    expectStatus: number = HttpStatus.NO_CONTENT,
  ) {
    if (Array.isArray(postId)) {
      for (const post of postId) {
        await request(this.application)
          .put(`${RouterPaths.posts}/${post.id}/like-status`)
          .auth(token, { type: 'bearer' })
          .send({ likeStatus: status })
          .expect(expectStatus);
      }
    } else {
      await request(this.application)
        .put(`${RouterPaths.posts}/${postId}/like-status`)
        .auth(token, { type: 'bearer' })
        .send({ likeStatus: status })
        .expect(expectStatus);
    }
  }

  checkPostData(responseModel: any, expectedResult: any) {
    expect(responseModel).toEqual(expectedResult);
  }

  async checkLength(totalCount: number) {
    const { body } = await request(this.application).get(
      `${RouterPaths.posts}`,
    );

    expect(body.totalCount).toBe(totalCount);
  }

  async deletePost(postId: number) {
    const beforeDelete = await request(this.application).get(
      `${RouterPaths.posts}/${postId}`,
    );

    expect(beforeDelete.body).toBeDefined();

    await request(this.application)
      .delete(`${RouterPaths.posts}/${postId}`)
      .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
      .expect(HttpStatus.NO_CONTENT);

    const afterDelete = await request(this.application)
      .get(`${RouterPaths.posts}/${postId}`)
      .expect(HttpStatus.NOT_FOUND);
  }
}
