import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { applyAppSettings } from './settings/apply-app.settings';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  applyAppSettings(app);

  await app.listen(process.env.PORT || 5000, () => {
    console.log('App starting listen port: ', process.env.PORT);
  });
}
bootstrap();
