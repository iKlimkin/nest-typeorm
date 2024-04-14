import { ConfigService } from '@nestjs/config';
import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { AppModule } from '../../../src/app.module';
import { EmailManager } from '../../../src/infra/managers/email-manager';
import { applyAppSettings } from '../../../src/settings/apply-app.settings';
import { ConfigurationType } from '../../../src/settings/config/configuration';
import { EmailMockService } from '../dummies/email.manager.mock';
import { cleanDatabase } from './dataBaseCleanup';
import { UsersTestManager } from '../managers/UsersTestManager';

export const initSettings = async (
  addSettingsToModuleBuilder?: (moduleBuilder: TestingModuleBuilder) => void
) => {
  const testingModuleBuilder: TestingModuleBuilder = Test.createTestingModule({
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
  const env = configService.get('env', { infer: true });

  console.log('in tests ENV: ', { env });

  applyAppSettings(app);

  await app.init();

  const usersTestManager = new UsersTestManager(app);

  const httpServer = app.getHttpServer();

  await cleanDatabase(httpServer);

  return {
    app,
    httpServer,
    usersTestManager,
    testingAppModule,
  };
};