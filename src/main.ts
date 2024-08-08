import {
  AppModule,
  ConfigService,
  ConfigurationType,
  NestFactory,
  applyAppSettings,
  visualizeStartApp,
} from '.';
import { applyAppIntegrationSettings } from './settings/integration.settings/apply-app-integrations.settings';

(async () => {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<ConfigurationType>);

  const PORT = configService.getOrThrow('port');

  applyAppSettings(app);

  await app.listen(PORT, () => {
    console.log(visualizeStartApp(PORT));
  });

  await applyAppIntegrationSettings(app, configService);
})();
