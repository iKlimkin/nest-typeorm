import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { runInTransaction } from '../../../../domain/transaction-wrapper';
import { FilesStorageAdapter } from '../../../../infra/adapters/files-storage.adapter';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { ResponseFileType } from '../../../files/api/models/output.file.types/response-file.type';
import { FilesService } from '../../../files/application/services/file-metadata.service';
import {
  PhotoSizeType,
  PhotoType,
} from '../../../files/domain/entities/file-metadata.entity';
import { PostImage } from '../../../files/domain/entities/post-images.entity';
import { BlogService } from '../blog.service';
import { UploadPostMainImageCommand } from './commands/upload-post-main-image.command';
import { FilesRepository } from '../../../files/infrastructure/files.repository';

@CommandHandler(UploadPostMainImageCommand)
export class UploadPostMainImageUseCase
  implements ICommandHandler<UploadPostMainImageCommand>
{
  constructor(
    private dataSource: DataSource,
    private filesAdapter: FilesStorageAdapter,
    private blogService: BlogService,
    private filesService: FilesService,
    public filesRepo: FilesRepository,
  ) {}

  async execute(
    command: UploadPostMainImageCommand,
  ): Promise<LayerNoticeInterceptor<ResponseFileType>> {
    const { blogId, postId, fileBuffer, userId, fileType, fileName, fileSize } =
      command.data;
    const { filesAdapter, filesService, filesRepo } = this;
    const entitiesId = { blogId, userId };

    return runInTransaction(this.dataSource, async (manager) => {
      const notice = new LayerNoticeInterceptor<ResponseFileType>();
      const validationNotice = await this.blogService.ensureUserHasBlogAccess(
        blogId,
        userId,
        postId,
      );

      if (validationNotice.hasError)
        return validationNotice as LayerNoticeInterceptor;

      let postImages = await filesRepo.getPostImage(postId, manager);

      if (!postImages) {
        const newPostImages = new PostImage();
        newPostImages.setPostId(postId);

        postImages = await filesRepo.savePostImgs(newPostImages, manager);
      }

      const photoSizes = [
        { type: PhotoSizeType.ORIGINAL, width: 940, height: 432 },
        { type: PhotoSizeType.MIDDLE, width: 300, height: 180 },
        { type: PhotoSizeType.SMALL, width: 149, height: 96 },
      ];

      for (const photoSize of photoSizes) {
        const { type, width, height } = photoSize;

        const resizedFileBuffer = await filesService.resizeImage(
          fileBuffer,
          width,
          height,
        );

        const { ContentType, Key } = filesService.generateImageKey({
          ...entitiesId,
          postId,
          contentType: fileType,
          fileName,
          photoType: PhotoType.MAIN,
          photoSizeType: type,
        });

        const bucketParams = {
          Bucket: 'hub-bucket',
          Key,
          Body: resizedFileBuffer,
          ContentType,
        };

        const uploadResult = await filesAdapter.uploadFile(bucketParams);
        const { url: fileUrl, id: fileId } = uploadResult;

        const postMainFileMetadata = {
          photoSizeType: type,
          photoType: PhotoType.MAIN,
          fileHeight: height,
          fileWidth: width,
          fileName,
          fileSize,
          postImgId: postImages.id,
          fileUrl,
          fileId,
          fileType,
        };

        const savedImageNotice = await filesService.saveFileMetadata(
          postMainFileMetadata,
          manager,
        );

        if (savedImageNotice.hasError)
          return savedImageNotice as LayerNoticeInterceptor;
      }

      notice.addData({ postId });
      return notice;
    });
  }
}
