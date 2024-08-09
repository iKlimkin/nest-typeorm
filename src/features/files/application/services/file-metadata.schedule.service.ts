import {
  DeleteBucketCommand,
  DeleteObjectCommand,
  ListBucketsCommand,
  ListObjectsV2Command,
  S3Client,
  S3ClientConfig,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { ConfigurationType } from '../../../../settings/config/configuration';

@Injectable()
export class FilesScheduleService {
  private readonly maxBucketSize = 1 * 1024 * 1024 * 1024;
  s3Client: S3Client;
  private readonly bucketName: string;
  constructor(
    private readonly scheduleRegistry: SchedulerRegistry,
    private configService: ConfigService<ConfigurationType>,
  ) {
    const { endpoint, accessKeyId, region, secretAccessKey, bucketName } =
      this.configService.getOrThrow('aws', { infer: true });
    this.bucketName = bucketName;
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

  async releasingStorageMemory() {
    const totalSize = await this.getTotalBucketSize();

    if (totalSize > this.maxBucketSize) {
      await this.cleanUpBucket();
    }

    const buckets = await this.getAllBuckets();
    const thresholdDate = new Date();
    thresholdDate.setMonth(thresholdDate.getMonth() - 1);

    for (const bucket of buckets) {
      const isActive = await this.isBucketActive(
        bucket.Name || '',
        thresholdDate,
      );
      if (!isActive) {
        await this.deleteBucket(bucket.Name);
      }
    }
  }

  async deleteBucket(bucketName: string) {
    const response = await this.s3Client.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
      }),
    );

    for (const obj of response.Contents || []) {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: obj.Key,
        }),
      );
    }

    await this.s3Client.send(
      new DeleteBucketCommand({
        Bucket: bucketName,
      }),
    );
  }

  async isBucketActive(bucketName: string, thresholdDate: Date) {
    let continuationToken: string | undefined = undefined;
    let latestModificationDate = new Date(0);

    do {
      const response = await this.s3Client.send(
        new ListObjectsV2Command({
          Bucket: bucketName,
          ContinuationToken: continuationToken,
        }),
      );

      for (const obj of response.Contents || []) {
        if (obj.LastModified && obj.LastModified > latestModificationDate) {
          latestModificationDate = obj.LastModified;
        }
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return latestModificationDate > thresholdDate;
  }

  async getAllBuckets() {
    const response = await this.s3Client.send(new ListBucketsCommand({}));
    return response.Buckets || [];
  }

  async cleanUpBucket(bucketName?: string, maxFilesToDelete = 100) {
    const response = await this.s3Client.send(
      new ListObjectsV2Command({ Bucket: bucketName || this.bucketName }),
    );

    if (response.Contents) {
      const sortedFiles = response.Contents.sort((a, b) => {
        if (a.LastModified && b.LastModified) {
          return a.LastModified.getTime() - b.LastModified.getTime();
        }
        return 0;
      });

      for (let i = 0; i < Math.min(sortedFiles.length, maxFilesToDelete); i++) {
        const obj = sortedFiles[i];
        await this.s3Client.send(
          new DeleteObjectCommand({
            Bucket: bucketName || this.bucketName,
            Key: obj.Key,
          }),
        );
        console.log(`Deleted file: ${obj.Key}`);
      }
    }
  }

  async getTotalBucketSize(bucketName?: string): Promise<number> {
    let totalSize = 0;
    let continuationToken: string | undefined = undefined;

    do {
      const response = await this.s3Client.send(
        new ListObjectsV2Command({
          Bucket: bucketName || this.bucketName,
          ContinuationToken: continuationToken,
        }),
      );

      if (response.Contents) {
        totalSize += response.Contents.reduce(
          (acc, obj) => acc + (obj.Size || 0),
          0,
        );
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return totalSize;
  }

  async addJob(bucketName: string) {
    const { job, jobKey } = this.getJob(bucketName);

    if (!job) {
      const job = new CronJob(
        CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT,
        async () => {
          await this.releasingStorageMemory();
        },
      );

      this.scheduleRegistry.addCronJob(jobKey, job);
      job.start();
    }
  }
  removeJob(bucketName: string) {
    const { job, jobKey } = this.getJob(bucketName);
    if (job) {
      job.stop();
      this.scheduleRegistry.deleteCronJob(jobKey);
    }
  }

  private getJob(bucketName: string) {
    const jobKey = `bucket-${bucketName}`;
    try {
      const job = this.scheduleRegistry.getCronJob(jobKey);
      return { job, jobKey };
    } catch (error) {
      return { jobKey, job: null };
    }
  }
}
