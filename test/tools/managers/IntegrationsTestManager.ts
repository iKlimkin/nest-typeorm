import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { IntegrationsRouting } from '../routes/telegram.routing';
import { BaseTestManager } from './BaseTestManager';
import { SuperTestBody } from '../models/body.response.model';
import { TelegramCTX } from '../../../src/features/integrations/api/models/telegram-types';
import { TelegramMetaUser } from '../../../src/features/integrations/domain/entities/telegram-meta-user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export class IntegrationsTestManager extends BaseTestManager {
  private telegramRepo: Repository<TelegramMetaUser>;
  constructor(
    protected readonly app: INestApplication,
    protected readonly routing: IntegrationsRouting,
  ) {
    super(routing, app);
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
