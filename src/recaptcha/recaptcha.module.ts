import { Module } from '@nestjs/common';
import { RecaptchaController } from './recaptcha.controller';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { CaptureAdapter } from '../infra/adapters/capture.adapter';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', '..', 'src', 'static'),
    }),
  ],
  controllers: [RecaptchaController],
  providers: [CaptureAdapter],
  exports: [CaptureAdapter],
})
export class RecaptchaModule {}
