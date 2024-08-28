import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PathMappings, RouterPaths } from '../../../src/infra/utils/routing';

export class BasicAuthorization {
  constructor(protected readonly app: INestApplication) {}
  private application = this.app.getHttpServer();

  async testPostAuthorization(
    path: PathMappings,
    entityId?: string,
    optional?: PathMappings,
    expectedStatus: number = HttpStatus.UNAUTHORIZED,
  ) {
    if (!optional) {
      await request(this.application)
        .post(`${RouterPaths[path]}`)
        .expect(expectedStatus);
    } else {
      await request(this.application)
        .post(`${RouterPaths[path]}/${entityId}${RouterPaths[optional]}`)
        .expect(expectedStatus);
    }
  }

  async testPutAuthorization(
    path: PathMappings,
    entityId: string,
    expectedStatus: number = HttpStatus.UNAUTHORIZED,
    optional?: PathMappings,
  ) {
    if (!optional) {
      await request(this.application)
        .put(`${RouterPaths[path]}/${entityId}`)
        .expect(expectedStatus);
    } else {
      await request(this.application)
        .put(`${RouterPaths[path]}/${entityId}${RouterPaths[optional]}`)
        .expect(expectedStatus);
    }
  }

  async testDeleteAuthorization(
    path: PathMappings,
    entityId: string,
    expectedStatus: number = HttpStatus.UNAUTHORIZED,
  ) {
    await request(this.application)
      .delete(`${RouterPaths[path]}/${entityId}`)
      .expect(expectedStatus);
  }

  async testDeleteSAAuthorization(
    path: PathMappings,
    blogId: string,
    postId: string,
    expectedStatus: number = HttpStatus.UNAUTHORIZED,
  ) {
    await request(this.application)
      .delete(`${RouterPaths[path]}/${blogId}/posts/${postId}`)
      .expect(expectedStatus);
  }
}
