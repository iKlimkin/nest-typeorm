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
import { UploadBlogMainImageCommand } from './commands/upload-blog-main-image.command';

@CommandHandler(UploadBlogMainImageCommand)
export class UploadBlogMainImageUseCase
  implements ICommandHandler<UploadBlogMainImageCommand>
{
  constructor(
    private dataSource: DataSource,
    private filesService: FilesService,
  ) {}

  async execute(
    command: UploadBlogMainImageCommand,
  ): Promise<LayerNoticeInterceptor<ResponseFileType>> {
    const uploadData = command.data;

    const photoTypes = {
      photoSizeType: PhotoSizeType.ORIGINAL,
      photoType: PhotoType.MAIN,
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
