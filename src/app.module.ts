import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoreModule } from './core/core.module';
import { AuthModule } from './features/auth/auth.module';
import { PaymentModule } from './features/integrations/payments/modules/payment.module';
import { TelegramModule } from './features/integrations/telegram/modules/telegram.module';
import { FilesStorageAdapter } from './infra/adapters/files-storage.adapter';
import { S3FilesStorageAdapter } from './infra/adapters/s3-files-storage.adapter';
import { RecaptchaModule } from './recaptcha/recaptcha.module';
import { configModule } from './settings/app-config.module';
import { controllers } from './settings/app-controllers';
import { providers } from './settings/app-providers';
import { entities } from './settings/entities';
import { TypeOrmOptions } from './settings/typeorm-options';
import { StaticModule } from './static/static.module';

@Module({
  imports: [
    CqrsModule,
    configModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useClass: TypeOrmOptions,
    }),
    TypeOrmModule.forFeature([...entities]),
    ScheduleModule.forRoot(),
    CoreModule,
    AuthModule,
    StaticModule,
    PaymentModule,
    TelegramModule,
    RecaptchaModule,
  ],
  controllers,
  providers: [
    ...providers,
    { provide: FilesStorageAdapter, useClass: S3FilesStorageAdapter },
  ],
})
export class AppModule {}
