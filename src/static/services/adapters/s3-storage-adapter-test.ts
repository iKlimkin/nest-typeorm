import {
  S3Client,
  S3ClientConfig,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { Body, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigurationType } from '../../../settings/config/configuration';
import { SaveFileResultType } from '../../use-cases/save-file.use-case';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3StorageAdapter {
  s3Client: S3Client;
  mainDomain: string;
  bucketName: string;

  constructor(private configService: ConfigService<ConfigurationType>) {
    const { endpoint, accessKeyId, region, secretAccessKey } =
      this.configService.getOrThrow('aws', { infer: true });
    const { hostname } = new URL(endpoint);
    this.mainDomain = hostname;
    this.bucketName = 'hub-bucket';
    const params = {
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      endpoint,
    } as S3ClientConfig;

    this.s3Client = new S3Client(params);
  }

  async saveFile(userId: string, buffer: Buffer): Promise<SaveFileResultType> {
    const bucketParams = {
      Bucket: this.bucketName,
      Key: `content/users/${userId}/avatars/${userId}.png`,
      Body: buffer,
      ContentType: 'image/png',
    };
    try {
      const uploadResult = await this.s3Client.send(
        new PutObjectCommand(bucketParams),
      );
      const outputResult = {
        url: `https://${bucketParams.Bucket}.${this.mainDomain}/${bucketParams.Key}`,
        id: uploadResult.ETag,
      };

      return outputResult;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async deleteFile(fileId: string) {
    const bucketParams = {
      Bucket: this.bucketName,
      Key: fileId,
    };
    try {
      console.log(bucketParams);

      const data = await this.s3Client.send(
        new DeleteObjectCommand(bucketParams),
      );
      console.log({ data });
      return data;
    } catch (error) {
      throw error;
    }
  }

  async getSecretUrl(filedId: string) {
    const getObjectParams = {
      Bucket: this.bucketName,
      Key: filedId,
      Body: 'BODY',
    };
    const command = new GetObjectCommand(getObjectParams);
    const url = await getSignedUrl(this.s3Client, command, { expiresIn: 30 });

    return url;
  }
}
