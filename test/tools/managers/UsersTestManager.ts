import { HttpServer, HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { JwtTokens } from '../../../src/features/auth/api/models/auth-input.models.ts/jwt.types';
import { UserProfileType } from '../../../src/features/auth/api/models/auth.output.models/auth.output.models';
import { AuthUserType } from '../../../src/features/auth/api/models/auth.output.models/auth.user.types';
import { RouterPaths } from '../../../src/infra/utils/routing';
import { BaseTestManager } from './BaseTestManager';
import { AuthUsersRouting } from '../routes/users.routing';
import { SuperTestBody } from '../models/body.response.model';
import { usersData } from '../helpers/users-seed';

export class UsersTestManager extends BaseTestManager {
  constructor(
    protected readonly app: INestApplication,
    protected readonly routing: AuthUsersRouting,
  ) {
    super(app);
  }

  createInputData(field?: AuthUserType | any): AuthUserType {
    if (!field) {
      return {
        login: ' ',
        password: ' ',
        email: ' ',
      };
    } else {
      return {
        login: field.login || 'login',
        password: field.password || 'password',
        email: field.email || 'kr4mboy@gmail.com',
      };
    }
  }

  expectCorrectModel(createModel: any, responseModel: any) {
    expect(createModel.name).toBe(responseModel.name);
    expect(createModel.email).toBe(responseModel.email);
  }

  async createSA(
    inputData: AuthUserType,
    expectedStatus = HttpStatus.CREATED,
  ): Promise<Omit<AuthUserType, 'password'>> {
    const result = await request(this.application)
      .post(RouterPaths.users)
      .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
      .send(inputData)
      .expect(expectedStatus);

    return result.body;
  }

  createUsersToVerifyValidation = async () => {
    usersData.forEach(async (user) => {
      try {
        await this.createSA(user);
      } catch (error) {
        console.log({ error });
      }
    });
  };

  async createUsers(
    numberOfUsers = 3,
  ): Promise<{ users: AuthUserType[]; accessTokens: string[] }> {
    const users: AuthUserType[] = [];
    const accessTokens: string[] = [];

    for (let i = 0; i < numberOfUsers; i++) {
      const userData = {
        login: `login${i}`,
        email: `email${i}@test.test`,
      };

      const userInputData = this.createInputData(userData);
      const sa = await this.createSA(userInputData);

      const { accessToken } = await this.authLogin(userInputData);

      users.push({ ...sa, password: userInputData.password });
      accessTokens.push(accessToken);
    }
    return { users, accessTokens };
  }

  async registration(
    inputData: AuthUserType,
    expectedStatus: number = HttpStatus.NO_CONTENT,
  ) {
    const response = await request(this.application)
      .post(`${RouterPaths.auth}/registration`)
      .send(inputData)
      .expect(expectedStatus);

    return response.body;
  }

  async registrationEmailResending(
    email: string,
    expectedStatus: number = HttpStatus.NO_CONTENT,
  ) {
    const response = await request(this.application)
      .post(`${RouterPaths.auth}/registration-email-resending`)
      .send({ email })
      .expect(expectedStatus);

    return response.body;
  }

  async registrationConfirmation(
    code: string | null,
    expectedStatus: number = HttpStatus.NO_CONTENT,
  ) {
    await request(this.application)
      .post(`${RouterPaths.auth}/registration-confirmation`)
      .send({ code })
      .expect(expectedStatus);
  }

  async updateUser(adminAccessToken: string, updateModel: any) {
    return request(this.application)
      .put('/api/users')
      .auth(adminAccessToken, {
        type: 'bearer',
      })
      .send(updateModel)
      .expect(HttpStatus.NO_CONTENT);
  }

  async authLogin(
    user: AuthUserType,
    byLogin: boolean | null = false,
    expectedStatus = HttpStatus.OK,
  ): Promise<JwtTokens | any> {
    const res = await request(this.application)
      .post(this.routing.login())
      .send({
        loginOrEmail: byLogin ? user.login : user.email,
        password: user.password || 'qwerty',
      })
      .expect(expectedStatus);

    if (res.status === HttpStatus.OK) {
      const token = res.body;
      const refreshToken = this.extractRefreshToken(res);
      return { refreshToken, accessToken: token.accessToken } as JwtTokens;
    }

    return res.body;
  }

  async refreshToken(
    refreshToken: string,
    expectedStatus: number = HttpStatus.OK,
  ): Promise<JwtTokens | any> {
    const response = await request(this.application)
      .post(`${RouterPaths.auth}/refresh-token`)
      .set('Cookie', `${refreshToken}`)
      .expect(expectedStatus);

    if (expectedStatus === HttpStatus.OK) {
      expect(response.body).toEqual({ accessToken: expect.any(String) });
      expect(response.headers['set-cookie']).toBeDefined();

      const { accessToken } = response.body;
      const rt = this.extractRefreshToken(response);

      return { accessToken, refreshToken: rt };
    }

    return response.body;
  }

  checkUserData(responseModel: any, expectedResult: any) {
    expect(responseModel).toEqual(expectedResult);
  }

  async me(
    user: AuthUserType = null,
    token: string,
    expectedStatus = HttpStatus.OK,
  ) {
    let userProfile: UserProfileType;
    await request(this.application)
      .get(this.routing.me())
      .auth(token, this.constants.authBearer)
      .expect(expectedStatus)
      .expect(({ body }: SuperTestBody<UserProfileType>) => {
        userProfile = body;

        user &&
          expect(userProfile).toEqual({
            email: user.email,
            login: user.login,
            userId: expect.any(String),
          });
      });

    return userProfile;
  }

  async logout(
    refreshToken: string,
    expectedStatus: number = HttpStatus.NO_CONTENT,
  ) {
    await request(this.application)
      .post(`${RouterPaths.auth}/logout`)
      .set('Cookie', `${refreshToken}`)
      .expect(expectedStatus);
  }

  async deleteUser(userId: number) {
    await request(this.application)
      .delete(`${RouterPaths.users}/${userId}`)
      .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
      .expect(HttpStatus.NO_CONTENT);

    await request(this.application)
      .get(`${RouterPaths.users}/${userId}`)
      .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
      .expect(HttpStatus.NOT_FOUND);
  }

  private extractRefreshToken(response: any) {
    return response.headers['set-cookie'][0].split(';')[0];
  }
}
