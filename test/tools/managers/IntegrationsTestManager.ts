import { HttpStatus, INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import crypto from 'crypto';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { TelegramCTX } from '../../../src/features/integrations/telegram/api/models/input/telegram-types';
import { TelegramMetaUser } from '../../../src/features/integrations/telegram/domain/entities/telegram-meta-user.entity';
import { PathMappings, RouterPaths } from '../../../src/infra/utils/routing';
import { SuperTestBody } from '../models/body.response.model';
import { ApiRouting } from '../routes/api.routing';
import { PaymentsRouting } from '../routes/payments.routing';
import { TelegramRouting } from '../routes/telegram.routing';
import { BaseTestManager } from './BaseTestManager';
import { IntegrationMethod } from '../../../src/infra/enum/integration.enums';

type IntegrationManagers = {
  [IntegrationMethod.Telegram]: TelegramTestManager;
  [IntegrationMethod.Stripe]: PaymentsTestManager;
};

export class IntegrationsTestManagerCreator extends BaseTestManager {
  private readonly integrationRoutes: ApiRouting['integrations'];
  constructor(protected readonly application: INestApplication) {
    super(application);
    this.integrationRoutes = new ApiRouting().integrations;
  }

  createIntegrationManager(method: IntegrationMethod) {
    switch (method) {
      case IntegrationMethod.Telegram:
        return new TelegramTestManager(
          this.application,
          this.integrationRoutes.telegram,
        );
      case IntegrationMethod.Stripe:
        return new PaymentsTestManager(
          this.application,
          this.integrationRoutes.payments,
        );
      default:
        throw new Error(`Unknown integration: ${method}`);
    }
  }
}

export class TelegramTestManager extends BaseTestManager {
  private telegramRepo: Repository<TelegramMetaUser>;
  constructor(
    protected readonly app: INestApplication,
    protected readonly routing: TelegramRouting,
  ) {
    super(app);
    this.telegramRepo = this.app.get(getRepositoryToken(TelegramMetaUser));
  }

  async getAuthBotPersonalLink(
    accessToken: string,
    expectStatus = HttpStatus.OK,
  ): Promise<string> {
    let link = '';
    await request(this.app.getHttpServer())
      .get(this.routing.getAuthBotPersonalLink())
      .auth(accessToken, this.constants.authBearer)
      .expect(expectStatus)
      .expect(({ body }: SuperTestBody<{ link: string }>) => {
        link = body.link;
      });

    return link;
  }

  async setTelegramBotWebhook() {
    await request(this.application)
      .post(this.routing.setTelegramBotWebhook())
      .expect(HttpStatus.NO_CONTENT);
  }

  async forTelegramBotHook(ctx: Partial<TelegramCTX>) {
    await request(this.application)
      .post(this.routing.forTelegramBotHook())
      .send(ctx)
      .expect(HttpStatus.NO_CONTENT);
  }

  async getTelegramMetaUser(userId: string): Promise<TelegramMetaUser> {
    return await this.telegramRepo.findOneBy({ userId });
  }
}

export class PaymentsTestManager extends BaseTestManager {
  constructor(
    protected readonly app: INestApplication,
    protected readonly routing: PaymentsRouting,
  ) {
    super(app);
  }

  async handleSuccessPayment(sessionId: string) {
    await request(this.application)
      .post(this.routing.handleSuccessPayment())
      .query(sessionId)
      .expect(HttpStatus.NO_CONTENT);
  }

  async handleFailedPayment(sessionId: string) {
    await request(this.application)
      .post(this.routing.handleFailedPayment())
      .query(sessionId)
      .expect(HttpStatus.NO_CONTENT);
  }

  async forPaymentsHook(signature: string) {
    await request(this.application)
      .post(this.routing.forPaymentsHook())
      .set('stripe-signature', signature)
      .send()
      .expect(HttpStatus.NO_CONTENT);
  }

  static generateTestSignature(
    secret: string,
    payload: string,
    timestamp: string,
  ): string {
    const signedPayload = `${Math.floor(
      Date.now() / 1000,
    ).toString()}.${payload}`;
    const signature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');
    return `t=${timestamp},v1=${signature}`;
  }
}
