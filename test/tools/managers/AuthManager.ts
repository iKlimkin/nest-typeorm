import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AuthUserType } from '../../../src/features/auth/api/models/auth.output.models/auth.user.types';
import { ErrorsMessages } from '../../../src/infra/utils/error-handler';
import { RouterPaths } from '../helpers/routing';

export class AuthManager {
  constructor(protected readonly app: INestApplication) {}
  private application = this.app.getHttpServer();

  async registration(
    inputData: AuthUserType,
    expectedStatus: number = HttpStatus.NO_CONTENT
  ) {
    return await request(this.application)
      .post(`${RouterPaths.auth}/registration`)
      .send(inputData)
      .expect(expectedStatus);
  }

  async registrationEmailResending(
    email: string,
    expectedStatus: number = HttpStatus.NO_CONTENT
  ) {
    await request(this.application)
      .post(`${RouterPaths.auth}/registration-email-resending`)
      .send({ email })
      .expect(expectedStatus);
  }

  async passwordRecovery(
    email: string,
    expectedStatus: number = HttpStatus.NO_CONTENT
  ) {
    await request(this.application)
      .post(`${RouterPaths.auth}/password-recovery`)
      .send({ email })
      .expect(expectedStatus);
  }

  async newPassword(
    email: string,
    expectedStatus: number = HttpStatus.NO_CONTENT
  ) {
    await request(this.application)
      .post(`${RouterPaths.auth}/new-password`)
      .send({ email })
      .expect(expectedStatus);
  }

  async registrationConfirmation(
    code: string = 'any',
    expectedStatus: number = HttpStatus.NO_CONTENT
  ) {
    await request(this.application)
      .post(`${RouterPaths.auth}/registration-confrirmation`)
      .send({ code })
      .expect(expectedStatus);
  }

  async login(
    user?: AuthUserType | null,
    expectedStatus: number = HttpStatus.OK
  ) {
    const response = await request(this.application)
      .post(`${RouterPaths.auth}/login`)
      .send({
        loginOrEmail: user?.login || user?.email || 'invalid',
        password: user?.password || 'qwerty',
      })
      .expect(expectedStatus);

    return response.body;
  }

  async logout(
    refreshToken: string,
    expectedStatus: number = HttpStatus.NO_CONTENT
  ) {
    await request(this.application)
      .post(`${RouterPaths.auth}/logout`)
      .set('Cookie', `${refreshToken}`)
      .expect(expectedStatus);
  }

  async authMe(
    user: AuthUserType,
    token: string,
    expectedStatus: number = HttpStatus.OK
  ) {
    const res = await request(this.application)
      .get(`${RouterPaths.auth}/me`)
      .auth(token, { type: 'bearer' })
      .expect(expectedStatus);

    expect(res.body).toEqual({
      email: user.email,
      login: user.login,
      userId: expect.any(String),
    });
  }

  async refreshToken(
    refreshToken: string,
    expectedStatus: number = HttpStatus.OK
  ) {
    const tokens = await request(this.application)
      .post(`${RouterPaths.auth}/refresh-token`)
      .set('Cookie', `${refreshToken}`)
      .expect(expectedStatus);

    if (expectedStatus === HttpStatus.OK) {
      expect(tokens.body).toEqual({ accessToken: expect.any(String) });
    }

    return tokens;
  }

  checkData(
    responceModel: AuthUserType | { errorsMessages: ErrorsMessages[] },
    expectedResult: AuthUserType | { errorsMessages: ErrorsMessages[] }
  ) {
    expect(responceModel).toEqual(expectedResult);
  }
}
