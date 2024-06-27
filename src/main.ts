import {
  AppModule,
  ConfigService,
  NestFactory,
  applyAppSettings,
  visualizeStartApp,
} from '.';

(async () => {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const PORT = configService.getOrThrow('Port');

  applyAppSettings(app);

  await app.listen(PORT, () => {
    console.log(visualizeStartApp(PORT));
  });
})();
