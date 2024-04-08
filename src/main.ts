import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { applyAppSettings } from './settings/apply-app.settings';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.getOrThrow('Port');

  applyAppSettings(app);

  await app.listen(port, () => {
    console.log('App starting listen port: ', port);
  });
}
bootstrap();
