import { ContentType } from '../../../../files/api/models/file-types';

export class UploadPostMainImageCommand {
  constructor(public data: UploadPostMainImageDataType) {}
}

export type UploadPostMainImageDataType = {
  blogId: string;
  userId: string;
  postId: string;
  fileName: string;
  fileBuffer: Buffer;
  fileSize: number;
  fileType: ContentType;
  fileWidth: number;
  fileHeight: number;
};

export type CreateFileMetadataType = Omit<
  UploadPostMainImageCommand,
  'fileBuffer'
> & { url: string; id: string };
