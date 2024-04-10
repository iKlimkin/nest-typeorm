import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { JwtTokens } from '../../../src/features/auth/api/models/auth-input.models.ts/jwt.types';
import { UserProfileType } from '../../../src/features/auth/api/models/auth.output.models/auth.output.models';
import { AuthUserType } from '../../../src/features/auth/api/models/auth.output.models/auth.user.types';
import { RouterPaths } from '../helpers/routing';

export class QuizTestManager {
  constructor(protected readonly app: INestApplication) {}
  private application = this.app.getHttpServer();

  createQuestion(field?: any) {
    if (!field) {
      return {
        body: ' ',
        correctAnswers: ' ',
      };
    } else {
      return {
        body: field.body,
        correctAnswers: field.correctAnswers
      };
    }
  }
}
