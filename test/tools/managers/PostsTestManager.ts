import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import {
  LikesStatuses
} from '../../../src/domain/reaction.models';
import { PaginationViewModel } from '../../../src/domain/sorting-base-filter';
import { SAViewType } from '../../../src/features/admin/api/models/user.view.models/userAdmin.view-type';
import { CommentsViewModel } from '../../../src/features/comments/api/models/comments.view.models/comments.view-model.type';
import { CommentsQueryFilter } from '../../../src/features/comments/api/models/output.comment.models/comment-query.filter';
import { CreatePostModel } from '../../../src/features/posts/api/models/input.posts.models/create.post.model';
import { PostsQueryFilter } from '../../../src/features/posts/api/models/output.post.models/posts-query.filter';
import { PostViewModelType } from '../../../src/features/posts/api/models/post.view.models/post-view-model.type';
import { constants, feedbacksConstants } from '../helpers/constants';
import { RouterPaths } from '../helpers/routing';
import { SuperTestBody } from '../models/body.response.model';
import { PostsRouting } from '../routes/posts.routing';
import { BaseTestManager } from './BaseTestManager';

export type CreationCommentData = {
  user?: SAViewType;
  accessToken: string;
  postId: string;
  content: string;
};

export type CommentInputData = CreationCommentData & {
  likeStatus?: LikesStatuses;
  likesCount?: number;
  dislikesCount?: number;
};

type CreateTestCommentData = {
  content: string;
  postId: string;
  accessToken: string;
};

export class PostsTestManager extends BaseTestManager {
  constructor(
    protected readonly app: INestApplication,
    protected readonly routing: PostsRouting,
  ) {
    super(routing, app);
  }

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
  createCommentData(
    field?: Partial<CreateTestCommentData>,
  ): CreateTestCommentData {
    let inputData = {};
    if (!field) {
      inputData['content'] = '';
      inputData['postId'] = '';
      inputData['accessToken'] = '';
    } else {
      inputData['content'] =
        field.content || 'test content to create a comment';
      inputData['postId'] = field.postId || '';
      inputData['accessToken'] =
        field.accessToken || constants.inputData.expiredAccessToken;
    }
    return inputData as CreateTestCommentData;
  }

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
    expectedStatus = HttpStatus.CREATED,
  ): Promise<{ comment: CommentsViewModel }> {
    const { accessToken, content, postId } = inputData;
    const response = await request(this.application)
      .post(this.routing.createComment(postId))
      .auth(accessToken, this.constants.authBearer)
      .send({ content })
      .expect(expectedStatus);

    const comment = response.body;

    return { comment };
  }

  async createComments(
    accessToken: string,
    postId: string,
    numberOfComments = 2,
  ): Promise<CommentsViewModel[]> {
    let comments: CommentsViewModel[] = [];

    for (let i = 0; i < numberOfComments; i++) {
      const inputContent = feedbacksConstants.createdContent;
      const commentData = {
        content: inputContent[i > 4 && i < 10 ? i - inputContent.length : 0],
        postId,
        accessToken,
      };

      const { comment } = await this.createComment(commentData);

      comments.push(comment);
    }

    return comments;
  }

  async getCommentsForTheCurrentPost(
    postId: string,
    query?: Partial<CommentsQueryFilter>,
    accessToken?: string,
    expectStatus = HttpStatus.OK,
  ): Promise<PaginationViewModel<CommentsViewModel>> {
    let commentsPaging: PaginationViewModel<CommentsViewModel>;
    await request(this.application)
      .get(this.routing.getComments(postId))
      .auth(accessToken, this.constants.authBearer)
      .query(query)
      .expect(expectStatus)
      .expect(
        ({ body }: SuperTestBody<PaginationViewModel<CommentsViewModel>>) => {
          commentsPaging = body;
        },
      );

    return commentsPaging;
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

  async getPosts(
    accessToken?: string,
    query?: Partial<PostsQueryFilter>,
    expectStatus = HttpStatus.OK,
  ) {
    let commentsPaging: PaginationViewModel<PostViewModelType>;
    await request(this.application)
      .get(this.routing.getPosts())
      .auth(accessToken, this.constants.authBearer)
      .query(query)
      .expect(expectStatus)
      .expect(
        ({ body }: SuperTestBody<PaginationViewModel<PostViewModelType>>) => {
          expect(body).toBeDefined();
          commentsPaging = body;
        },
      );

    return commentsPaging;
  }

  async getPostById(
    postId: string,
    accessToken?: string,
    expectStatus = HttpStatus.OK,
  ): Promise<PostViewModelType> {
    let postViewModel: PostViewModelType;
    await request(this.application)
      .get(this.routing.getPost(postId))
      .auth(accessToken || 'token', this.constants.authBearer)
      .expect(expectStatus)
      .expect(({ body }: SuperTestBody<PostViewModelType>) => {
        postViewModel = body;
      });

    return postViewModel;
  }

  async likeStatusOperations(
    postId: string | PostViewModelType[],
    token: string,
    status = LikesStatuses.None,
    expectStatus = HttpStatus.NO_CONTENT,
  ) {
    if (Array.isArray(postId)) {
      for (const post of postId) {
        await request(this.application)
          .put(`${RouterPaths.posts}/${post.id}/like-status`)
          .auth(token, this.constants.authBearer)
          .send({ likeStatus: status })
          .expect(expectStatus);
      }
    } else {
      await request(this.application)
        .put(this.routing.updateReaction(postId))
        .auth(token, this.constants.authBearer)
        .send({ likeStatus: status })
        .expect(expectStatus);
    }
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
