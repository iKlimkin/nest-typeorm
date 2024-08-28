import { Injectable } from '@nestjs/common';
import {
  FileMetadataBlogImagesType,
  FileMetadataTypeEntityType,
} from '../../../blogs/application/use-case/commands/upload-background-wallpaper.command';
import { LayerNoticeInterceptor } from '../../../posts/api/controllers';
import { ContentType } from '../../api/models/file-types';
import {
  FileMetadata,
  PhotoSizeType,
  PhotoType,
} from '../../domain/entities/file-metadata.entity';
import { FilesRepository } from '../../infrastructure/files.repository';
import * as sharp from 'sharp';
import { EntityManager } from 'typeorm';
import { BlogService } from '../../../blogs/application/blog.service';
import { BlogImage } from '../../domain/entities/blog-images.entity';
import { UploadMainImageDataType } from '../../../blogs/application/use-case/commands/upload-blog-main-image.command';
import { FilesStorageAdapter } from '../../../../infra/adapters/files-storage.adapter';
import { ResponseFileType } from '../../api/models/output.file.types/response-file.type';

@Injectable()
export class FilesService {
  private readonly location: string;
  constructor(
    private readonly filesRepo: FilesRepository,
    private blogService: BlogService,
    private filesAdapter: FilesStorageAdapter,
  ) {
    this.location = this.constructor.name;
  }

  async saveFileMetadata(
    fileMetaDto: FileMetadataTypeEntityType,
    manager: EntityManager,
  ): Promise<LayerNoticeInterceptor<FileMetadata>> {
    try {
      const fileNotice = await FileMetadata.createMetadata(fileMetaDto);
      if (fileNotice.hasError) return fileNotice;

      const result = await this.filesRepo.save(fileNotice.data, manager);
      return new LayerNoticeInterceptor(result);
    } catch (error) {
      throw new Error(`${this.location}: ${error}`);
    }
  }

  async manageBlogImageUpload(
    uploadImageDto: UploadBlogDtoType,
  ): Promise<LayerNoticeInterceptor<ResponseFileType>> {
    const notice = new LayerNoticeInterceptor<ResponseFileType>();
    const {
      blogId,
      userId,
      manager,
      photoTypes,
      fileType,
      fileBuffer,
      bucketName,
      ...fileDimensions
    } = uploadImageDto;

    const entitiesId = { blogId, userId };
    const validationNotice = await this.blogService.ensureUserHasBlogAccess(
      blogId,
      userId,
    );

    if (validationNotice.hasError)
      return validationNotice as LayerNoticeInterceptor;

    let blogImages = await this.filesRepo.getBlogImage(blogId, manager);

    if (!blogImages) {
      const newBlogImage = new BlogImage();
      newBlogImage.setBlogId(blogId);

      blogImages = await this.filesRepo.saveBlogImgs(newBlogImage, manager);
    }

    const { ContentType, Key } = this.generateImageKey({
      ...entitiesId,
      contentType: fileType,
      fileName: fileDimensions.fileName,
      ...photoTypes,
    });

    const bucketParams = {
      Bucket: 'hub-bucket',
      Key,
      Body: fileBuffer,
      ContentType,
    };

    const uploadResult = await this.filesAdapter.uploadFile(bucketParams);
    const { url: fileUrl, id: fileId } = uploadResult;

    const mainFileMetadata: FileMetadataBlogImagesType = {
      ...photoTypes,
      ...fileDimensions,
      fileUrl,
      blogImgId: blogImages.id,
      fileId,
      fileType,
    };

    const savedMainImageNotice = await this.saveFileMetadata(
      mainFileMetadata,
      manager,
    );

    if (savedMainImageNotice.hasError)
      return savedMainImageNotice as LayerNoticeInterceptor;
    notice.addData({ blogId });

    return notice;
  }

  generateImageKey = (keyInfo: GenerateImageKeyType) => {
    const { blogId, userId, photoType, photoSizeType, contentType, fileName } =
      keyInfo;
    const [, fileExtension] = contentType.split('/');
    const timeStamp = new Date().getTime();
    const withExtension = fileName.endsWith(fileExtension);
    const fileSignature = withExtension ? fileName.split('.')[0] : fileName;

    let generatedKey = `images/bloggers/${
      keyInfo.postId ? 'posts' : 'blogs'
    }/${photoType}/blogId-${blogId}/`;

    if (keyInfo.postId) {
      generatedKey += `postId-${keyInfo.postId}/`;
    }
    generatedKey += `userId-${userId}/${photoSizeType}-${fileSignature}${timeStamp}.${fileExtension}`;

    return { Key: generatedKey, ContentType: contentType };
  };

  resizeImage = async (
    buffer: Buffer,
    width: number,
    height: number,
  ): Promise<Buffer> => sharp(buffer).resize(width, height).toBuffer();
}

type GenerateImageKeyType = {
  fileName: string;
  contentType: ContentType;
  blogId: string;
  userId: string;
  photoType: string;
  photoSizeType: PhotoSizeType;
  postId?: string;
};
type UploadBlogDtoType = UploadMainImageDataType & {
  manager: EntityManager;
  photoTypes: {
    photoSizeType: PhotoSizeType;
    photoType: PhotoType;
  };
  bucketName: BucketName;
};

export enum BucketName {
  HUB = 'hub-bucket',
}
