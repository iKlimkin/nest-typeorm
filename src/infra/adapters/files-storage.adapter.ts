import { Injectable } from '@nestjs/common';
import { PutObjectCommandInput } from '@aws-sdk/client-s3';
import { UploadFileOutputType } from './s3-files-storage.adapter';
@Injectable()
export class FilesStorageAdapter {
  constructor() {}

  async uploadFile(
    bucketParams: PutObjectCommandInput,
  ): Promise<UploadFileOutputType> {
    const result = { url: 'url', id: 'id' };
    return result;
  }
  async deleteFile(fileId: string) {
    return;
  }

  async getSecretUrl(filedId: string) {
    return 'secretUrl';
  }
}
