import {
  AppModule,
  ConfigService,
  NestFactory,
  applyAppSettings,
  visualizeStartApp,
} from '.';

(async () => {
  const app = await NestFactory.create(AppModule);

  const PORT = app.get(ConfigService).getOrThrow('port');
  
  applyAppSettings(app);

  await app.listen(PORT, () => {
    console.log(visualizeStartApp(PORT));
  });
})();
