import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './features/auth/auth.module';
import { FilesStorageAdapter } from './infra/adapters/files-storage.adapter';
import { S3FilesStorageAdapter } from './infra/adapters/s3-files-storage.adapter';
import { configModule } from './settings/app-config.module';
import { controllers } from './settings/app-controllers';
import { providers } from './settings/app-providers';
import { entities } from './settings/entities';
import { TypeOrmOptions } from './settings/typeorm-options';
import { StaticModule } from './static/static.module';

@Module({
  imports: [
    configModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useClass: TypeOrmOptions,
    }),
    TypeOrmModule.forFeature([...entities]),
    ScheduleModule.forRoot(),
    AuthModule,
    StaticModule,
    // TgModule,
  ],
  controllers,
  providers: [
    ...providers,
    { provide: FilesStorageAdapter, useClass: S3FilesStorageAdapter },
  ],
})
export class AppModule {}
