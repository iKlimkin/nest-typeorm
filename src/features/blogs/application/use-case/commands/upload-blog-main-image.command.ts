import { ContentType } from '../../../../files/api/models/file-types';

export class UploadBlogMainImageCommand {
  constructor(public data: UploadMainImageDataType) {}
}

export type UploadMainImageDataType = {
  blogId: string;
  userId: string;
  fileName: string;
  fileBuffer: Buffer;
  fileSize: number;
  fileType: ContentType;
  fileWidth: number;
  fileHeight: number;
};

export type CreateFileMetadataType = Omit<
  UploadBlogMainImageCommand,
  'fileBuffer'
> & { url: string; id: string };
