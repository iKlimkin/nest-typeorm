import { HttpServer, HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PaginationViewModel } from '../../../src/domain/sorting-base-filter';
import { CommentsViewModel } from '../../../src/features/comments/api/models/comments.view.models/comments.view-model.type';
import { RouterPaths } from '../../../src/infra/utils/routing';
import { SuperTestBody } from '../models/body.response.model';
import { BaseTestManager } from './BaseTestManager';
import { FeedbacksRouting } from '../routes/feedbacks.routing';
import { LikesStatuses } from '../../../src/domain/reaction.models';

type InputCommentsAndPaginationType = {
  searchNameTerm: string;
  sortBy: string;
  sortDirection: string;
  pageNumber: string;
  pageSize: string;
};

export class FeedbacksTestManager extends BaseTestManager {
  constructor(
    protected readonly app: INestApplication,
    protected readonly routing: FeedbacksRouting,
  ) {
    super(app);
  }

  async updateComment(
    inputData: {
      commentId: string;
      token: string;
      content?: string;
    },
    expectedStatus: number = HttpStatus.NO_CONTENT,
  ) {
    await request(this.application)
      .put(`${RouterPaths.comments}/${inputData.commentId}`)
      .auth(inputData.token, { type: 'bearer' })
      .send(
        inputData.content || {
          content: 'content include discussion about neurobiology',
        },
      )
      .expect(expectedStatus);
  }

  async getComment(
    commentId: string,
    accessToken?: string,
    expectStatus = HttpStatus.OK,
  ): Promise<CommentsViewModel> {
    let commentViewModel: CommentsViewModel;
    await request(this.application)
      .get(this.routing.getComment(commentId))
      .auth(accessToken || 'token', this.constants.authBearer)
      .expect(expectStatus)
      .expect(({ body }: SuperTestBody<CommentsViewModel>) => {
        commentViewModel = body;
      });

    return commentViewModel;
  }

  async deleteComment(
    commentId: number,
    token: string,
    expectedStatus: number = HttpStatus.NO_CONTENT,
  ) {
    await request(this.application)
      .delete(`${RouterPaths.comments}/${commentId}`)
      .auth(token, { type: 'bearer' })
      .expect(expectedStatus);
  }

  async likeStatusOperations(
    commentId: string,
    accessToken: string,
    likeStatus = LikesStatuses.None,
    expectStatus = HttpStatus.NO_CONTENT,
  ) {
    await request(this.application)
      .put(this.routing.updateReaction(commentId))
      .auth(accessToken, this.constants.authBearer)
      .send({ likeStatus })
      .expect(expectStatus);
  }
}
