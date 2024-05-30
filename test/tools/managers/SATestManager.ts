import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { SAViewType } from '../../../src/features/admin/api/models/userAdmin.view.models/userAdmin.view.model';
import { AuthUserType } from '../../../src/features/auth/api/models/auth.output.models/auth.user.types';
import { ErrorsMessages } from '../../../src/infra/utils/error-handler';
import { RouterPaths } from '../helpers/routing';

export class SATestManager {
  constructor(protected readonly app: INestApplication) {}
  private application = this.app.getHttpServer();

  createInputData(field?: AuthUserType | any, i: number = 1): AuthUserType {
    if (!field) {
      return {
        login: '',
        password: '',
        email: '',
      };
    } else {
      return {
        login: field.login || `ykt91${i % 2 === 0 ? 'eU' : 'Ue'}6F${i}`,
        password: field.password || `qwerty${i}`,
        email:
          field.email || `qwert${i % 2 === 0 ? i + 'QW' : i + 'wq'}@yaol.com`,
      };
    }
  }

  async createSA(
    inputData: AuthUserType,
    expectedStatus: number = HttpStatus.CREATED,
  ): Promise<{ user: SAViewType }> {
    const response = await request(this.application)
      .post(RouterPaths.users)
      .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
      .send(inputData)
      .expect(expectedStatus);

    const user = response.body;

    return { user };
  }

  // async getAdminUsers() {
  //   const response = await request(this.application)
  //     .get(RouterPaths.users)
  //     .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
  //     .expect(HttpStatus.OK);

  //   return response.body;
  // }

  async getSAPagination(query?, responseModel?: any) {
    if (query) {
      const {
        pageNumber,
        pageSize,
        searchEmailTerm,
        searchLoginTerm,
        sortBy,
        sortDirection,
      } = query;

      const response = await request(this.application)
        .get(RouterPaths.users)
        .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
        .query({
          pageSize: pageSize ? pageSize : '',
          pageNumber: pageNumber ? pageNumber : '',
          searchLoginTerm: searchLoginTerm ? searchLoginTerm : '',
          searchEmailTerm: searchEmailTerm ? searchEmailTerm : '',
          sortDirection: sortDirection ? sortDirection : '',
          sortBy: sortBy ? sortBy : '',
        })
        .expect(HttpStatus.OK);

      return response.body;
      // this.checkUserData(body, responseModel)
    }
  }

  checkUserData(
    responseModel: any | { errorsMessages: ErrorsMessages[] },
    expectedResult: SAViewType | { errorsMessages: ErrorsMessages[] },
  ) {
    expect(responseModel).toEqual(expectedResult);
  }
}
