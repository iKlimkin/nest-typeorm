import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { configModule } from './settings/app-config.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmOptions } from './settings/typeorm-options';
import { entities } from './settings/entities';
import { controllers } from './settings/app-controllers';
import { providers } from './settings/app-providers';
import { AuthModule } from './features/auth/auth.module';
import { ScheduleModule } from '@nestjs/schedule';
import { StaticModule } from './static/static.module';
import { FilesStorageAdapter } from './infra/adapters/files-storage.adapter';
import { S3FilesStorageAdapter } from './infra/adapters/s3-files-storage.adapter';

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
  ],
  controllers,
  providers: [
    ...providers,
    { provide: FilesStorageAdapter, useClass: S3FilesStorageAdapter },
  ],
})
export class AppModule {}
