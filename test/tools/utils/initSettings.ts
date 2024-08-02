import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AppModule } from '../../../src/app.module';
import { EmailManager } from '../../../src/infra/managers/email-manager';
import { applyAppSettings } from '../../../src/settings/apply-app.settings';
import { ConfigurationType } from '../../../src/settings/config/configuration';
import { EmailMockService } from '../dummies/email.manager.mock';
import { UsersTestManager } from '../managers/UsersTestManager';
import { ApiRouting } from '../routes/api.routing';
import { QuizQuestion } from '../../../src/features/quiz/domain/entities/quiz-questions.entity';
import { QuizAnswer } from '../../../src/features/quiz/domain/entities/quiz-answer.entity';

export const truncateDBTables = async (
  dataSource: DataSource,
  dbOwnerUserName: string = 'postgres',
) => {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
  try {
    await queryRunner.query(
      `
        CREATE OR REPLACE FUNCTION truncate_tables(username IN VARCHAR) RETURNS void AS $$
        DECLARE
            statements CURSOR FOR
                SELECT tablename FROM pg_tables
                WHERE tableowner = username 
                  AND schemaname = 'public' 
                  AND tablename != 'migrations';
        BEGIN
            FOR stmt IN statements LOOP
                EXECUTE 'TRUNCATE TABLE ' || quote_ident(stmt.tablename) || ' CASCADE;';
            END LOOP;
        END;
        $$ LANGUAGE plpgsql;

        SELECT truncate_tables('${dbOwnerUserName}');
      `,
    );
    console.log(`base has been cleared`);
    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
};

export const initSettings = async (
  addSettingsToModuleBuilder?: (moduleBuilder: TestingModuleBuilder) => void,
) => {
  try {
    const testingModuleBuilder: TestingModuleBuilder = Test.createTestingModule(
      {
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
      },
    )
      .overrideProvider(EmailManager)
      .useValue(EmailMockService);

    if (addSettingsToModuleBuilder) {
      addSettingsToModuleBuilder(testingModuleBuilder);
    }

    let testingAppModule = await testingModuleBuilder.compile();

    const app = testingAppModule.createNestApplication();

    const configService = app.get(ConfigService<ConfigurationType>);
    const { username } = configService.getOrThrow('pg', { infer: true });

    const env = configService.get('env', { infer: true });

    console.log('in tests ENV: ', { env });

    applyAppSettings(app);

    await app.init();
    const apiRouting = new ApiRouting();
    const usersTestManager = new UsersTestManager(app, apiRouting.users);

    const httpServer = app.getHttpServer();
    const dataSource = testingAppModule.get(DataSource);

    await truncateDBTables(dataSource, username);

    return {
      app,
      httpServer,
      usersTestManager,
      testingAppModule,
      dataSource,
      apiRouting,
    };
  } catch (error) {
    console.error('initSettings:', error);
  }
};
