import {
  AppModule,
  ConfigService,
  ConfigurationType,
  NestFactory,
  applyAppSettings,
  visualizeStartApp,
} from '.';

(async () => {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const configService = app.get(ConfigService<ConfigurationType>);
  const PORT = configService.getOrThrow('port');

  applyAppSettings(app);

  await app.listen(PORT, () => {
    console.log(visualizeStartApp(PORT));
  });
})();
