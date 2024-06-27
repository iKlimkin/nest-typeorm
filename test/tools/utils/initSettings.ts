import { ConfigService } from '@nestjs/config';
import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AppModule } from '../../../src/app.module';
import { EmailManager } from '../../../src/infra/managers/email-manager';
import { QuizAnswer, QuizQuestion } from '../../../src/settings';
import { applyAppSettings } from '../../../src/settings/apply-app.settings';
import { ConfigurationType } from '../../../src/settings/config/configuration';
import { EmailMockService } from '../dummies/email.manager.mock';
import { UsersTestManager } from '../managers/UsersTestManager';
import { cleanDatabase } from './dataBaseCleanup';
import { INestApplication } from '@nestjs/common';

const truncateDBTables = async (app: INestApplication, ownerName: string) => {
  const dataSource = await app.resolve(DataSource);

  await dataSource.query(
    `
            CREATE OR REPLACE FUNCTION truncate_tables(username IN VARCHAR) RETURNS void AS $$
            DECLARE
                statements CURSOR FOR
                    SELECT tablename FROM pg_tables
                    WHERE tableowner = username AND schemaname = 'public';
            BEGIN
                FOR stmt IN statements LOOP
                    EXECUTE 'TRUNCATE TABLE ' || quote_ident(stmt.tablename) || ' CASCADE;';
                END LOOP;
            END;
            $$ LANGUAGE plpgsql;

            SELECT truncate_tables('${ownerName}');
        `,
  );
};

export const initSettings = async (
  addSettingsToModuleBuilder?: (moduleBuilder: TestingModuleBuilder) => void,
) => {
  const testingModuleBuilder: TestingModuleBuilder = Test.createTestingModule({
    providers: [
      {
        provide: getRepositoryToken(QuizQuestion),
        useClass: Repository,
      },
      {
        provide: getRepositoryToken(QuizAnswer),
        useClass: Repository,
      },
    ],
    imports: [AppModule],
  })
    .overrideProvider(EmailManager)
    .useValue(EmailMockService);

  if (addSettingsToModuleBuilder) {
    addSettingsToModuleBuilder(testingModuleBuilder);
  }

  let testingAppModule = await testingModuleBuilder.compile();

  const app = testingAppModule.createNestApplication();

  const configService = app.get(ConfigService<ConfigurationType>);
  const dbOwner = configService.getOrThrow('pg', { infer: true }).username
  const env = configService.get('env', { infer: true });

  console.log('in tests ENV: ', { env });

  applyAppSettings(app);

  await app.init();

  const usersTestManager = new UsersTestManager(app);

  const httpServer = app.getHttpServer();

  // await cleanDatabase(httpServer);
  await truncateDBTables(app, dbOwner);

  return {
    app,
    httpServer,
    usersTestManager,
    testingAppModule,
  };
};
