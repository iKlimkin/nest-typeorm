import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
  S3ClientConfig,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigurationType } from '../../settings/config/configuration';

export type UploadFileOutputType = {
  url: string;
  id: string;
};

@Injectable()
export class S3FilesStorageAdapter {
  s3Client: S3Client;
  mainDomain: string;
  bucketName: string;

  constructor(private configService: ConfigService<ConfigurationType>) {
    const { endpoint, accessKeyId, region, secretAccessKey } =
      this.configService.getOrThrow('aws', { infer: true });

    const { hostname } = new URL(endpoint!);
    this.mainDomain = hostname;
    const params = {
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      endpoint,
      forcePathStyle: true,
    } as S3ClientConfig;

    this.s3Client = new S3Client(params);
  }

  async uploadFile(
    bucketParams: PutObjectCommandInput,
  ): Promise<UploadFileOutputType> {
    const { Bucket: bucketName, Key: key } = bucketParams;
    await this.ensureBucketExists(bucketName);
    try {
      const { ETag } = await this.s3Client.send(
        new PutObjectCommand(bucketParams),
      );
      const outputResult = {
        url: `https://${this.mainDomain}/${bucketName}/${key}`,
        id: ETag.split('"')[1],
      };

      return outputResult;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  private ensureBucketExists = async (bucketName: string) => {
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
      // console.log(`Bucket "${bucketName}" already exists.`);
    } catch (error) {
      if (error.name === 'NotFound' || error.$metadata.httpStatusCode === 404) {
        try {
          await this.s3Client.send(
            new CreateBucketCommand({ Bucket: bucketName }),
          );
          console.log(`Bucket "${bucketName}" created successfully.`);
        } catch (createError) {
          console.error(
            `Failed to create bucket "${bucketName}":`,
            createError,
          );
          throw createError;
        }
      } else {
        console.error(`Error checking bucket "${bucketName}":`, error);
        throw error;
      }
    }
  };
}
