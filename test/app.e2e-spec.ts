import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { aDescribe } from './tools/utils/aDescribe';
import { e2eTestNamesEnum, skipSettings } from './tools/utils/testsSettings';

aDescribe(skipSettings.for(e2eTestNamesEnum.app))('AppController (e2e)', () => {
  let app: INestApplication;
  
  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer()).get('/app').expect(200);
  });
});
