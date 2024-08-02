import { Injectable } from '@nestjs/common';
import { ListBucketsCommand } from '@aws-sdk/client-s3';

@Injectable()
export class FilesStorageAdapterTest {
  constructor() {}

  async saveFile(userId: string, buffer: Buffer) {
    return;
  }
  async deleteFile(fileId: string) {
    return;
  }

  async getSecretUrl(filedId: string) {
    return 'secretUrl';
  }
}
