import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { FilesController } from './files.controller';
import { CqrsModule } from '@nestjs/cqrs';
import { SaveUserFileUseCase } from './use-cases/save-file.use-case';
import { FilesStorageAdapterTest } from './services/adapters/files-storage-adapter-test';
import { S3StorageAdapter } from './services/adapters/s3-storage-adapter-test';
import { DeleteUserFileUseCase } from './use-cases/delete-file.use-case';
import { GetSecretAvatarUrlUseCase } from './use-cases/get-secret-avatar-url.use-case';

@Module({
  imports: [
    CqrsModule,
    ThrottlerModule.forRoot([{ ttl: 10000, limit: 50 }]),
  ],
  providers: [
    SaveUserFileUseCase,
    DeleteUserFileUseCase,
    FilesStorageAdapterTest,
    GetSecretAvatarUrlUseCase,
    { provide: FilesStorageAdapterTest, useClass: S3StorageAdapter },
  ],
  controllers: [FilesController],
  exports: [],
})
export class StaticModule {}
