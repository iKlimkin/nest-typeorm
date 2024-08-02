import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { runInTransaction } from '../../../../domain/transaction-wrapper';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { ResponseFileType } from '../../../files/api/models/output.file.types/response-file.type';
import {
  BucketName,
  FilesService,
} from '../../../files/application/services/file-metadata.service';
import {
  PhotoSizeType,
  PhotoType,
} from '../../../files/domain/entities/file-metadata.entity';
import { UploadBackgroundWallpaperCommand } from './commands/upload-background-wallpaper.command';

@CommandHandler(UploadBackgroundWallpaperCommand)
export class UploadBackgroundWallpaperUseCase
  implements ICommandHandler<UploadBackgroundWallpaperCommand>
{
  constructor(
    private dataSource: DataSource,
    private filesService: FilesService,
  ) {}

  async execute(
    command: UploadBackgroundWallpaperCommand,
  ): Promise<LayerNoticeInterceptor<ResponseFileType>> {
    const uploadData = command.data;
    const photoTypes = {
      photoSizeType: PhotoSizeType.ORIGINAL,
      photoType: PhotoType.WALLPAPER,
    };
    const bucketName = BucketName.HUB;

    return runInTransaction(this.dataSource, async (manager) => {
      return await this.filesService.manageBlogImageUpload({
        ...uploadData,
        photoTypes,
        manager,
        bucketName,
      });
    });
  }
}
