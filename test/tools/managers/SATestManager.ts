import { HttpServer, HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import {
  SAViewType,
  SAViewWithBannedUsersType,
} from '../../../src/features/admin/api/models/user.view.models/userAdmin.view-type';
import { AuthUserType } from '../../../src/features/auth/api/models/auth.output.models/auth.user.types';
import { ErrorsMessages } from '../../../src/infra/utils/error-handler';
import { SAUsersRouting } from '../routes/sa-users.routing';
import { AuthConstantsType, constants } from '../helpers/constants';
import {
  UserRestrictionCommandDto,
  UserRestrictionDto,
} from '../../../src/features/admin/api/models/input-sa.dtos.ts/user-restriction.dto';
import { PaginationViewModel } from '../../../src/domain/sorting-base-filter';
import { SAQueryFilter } from '../../../src/features/admin/api/models/outputSA.models.ts/sa-query.filter';
import { BaseTestManager } from './BaseTestManager';

export class SATestManager extends BaseTestManager {
  // protected readonly application: INestApplication<HttpServer>;
  protected readonly constants: AuthConstantsType;

  constructor(
    protected readonly app: INestApplication,
    protected readonly routing: SAUsersRouting,
  ) {
    super(routing, app);
    // this.application = this.app.getHttpServer();
    this.constants = constants.auth;
  }

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

  createBanRestriction = (data: Partial<UserRestrictionDto>) => ({
    isBanned: data.isBanned,
    banReason: data.banReason || 'The reason why user was banned or unbunned',
  });

  async createSA(
    inputData: AuthUserType,
    expectedStatus = HttpStatus.CREATED,
  ): Promise<{ user: SAViewType }> {
    const response = await request(this.application)
      .post(this.routing.createSA())
      .auth(
        this.constants.basicUser,
        this.constants.basicPass,
        this.constants.authBasic,
      )
      .send(inputData)
      .expect(expectedStatus);

    const user = response.body;

    return { user };
  }

  async getUsers(
    query?: Partial<SAQueryFilter>,
    expectStatus = HttpStatus.OK,
  ): Promise<PaginationViewModel<SAViewWithBannedUsersType>> {
    const response = await request(this.application)
      .get(this.routing.getUsers())
      .auth(
        this.constants.basicUser,
        this.constants.basicPass,
        this.constants.authBasic,
      )
      .query(query)
      .expect(expectStatus);

    return response.body;
  }

  async banUser(
    userId: string,
    reason: UserRestrictionDto,
    expectStatus = HttpStatus.NO_CONTENT,
  ) {
    await request(this.application)
      .put(this.routing.banUnbanRestriction(userId))
      .auth(
        this.constants.basicUser,
        this.constants.basicPass,
        this.constants.authBasic,
      )
      .send(reason)
      .expect(expectStatus);
  }

  async getSAPagination(query?, responseModel?: any) {
    if (query) {
      // const {
      //   pageNumber,
      //   pageSize,
      //   searchEmailTerm,
      //   searchLoginTerm,
      //   sortBy,
      //   sortDirection,
      // } = query;

      const response = await request(this.application)
        .get(this.routing.getUsers())
        .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
        .query(query)
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
