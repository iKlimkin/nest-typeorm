import { ContentType } from '../../../../files/api/models/file-types';
import {
  PhotoSizeType,
  PhotoType,
} from '../../../../files/domain/entities/file-metadata.entity';

export class UploadBackgroundWallpaperCommand {
  constructor(public data: UploadBackgroundWallpaperDataType) {}
}

type FileMetadataType = {
  fileName: string;
  fileBuffer: Buffer;
  fileSize: number;
  fileType: ContentType;
  fileWidth: number;
  fileHeight: number;
};

export type UploadBackgroundWallpaperDataType = FileMetadataType & {
  blogId: string;
  userId: string;
};

export type FileMetadataTypeEntityType = Omit<
  FileMetadataType,
  'fileBuffer'
> & {
  fileUrl: string;
  fileId: string;
  photoType: PhotoType;
  photoSizeType: PhotoSizeType;
  blogImgId?: string;
  postImgId?: string;
};

export type FileMetadataBlogImagesType = FileMetadataTypeEntityType & {
  blogImgId: string;
};
export type FileMetadataPostImagesType = FileMetadataTypeEntityType & {
  postImgId: string;
};
