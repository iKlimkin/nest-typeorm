import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { FileMetadata } from '../../../../settings';
import { UploadBackgroundWallpaperCommand } from '../../../blogs/application/use-case/commands/upload-background-wallpaper.command';
import { UploadBlogMainImageCommand } from '../../../blogs/application/use-case/commands/upload-blog-main-image.command';
import { UploadPostMainImageCommand } from '../../../blogs/application/use-case/commands/upload-post-main-image.command';
import { BaseFilesCrudApiService } from './base-files-crud-api.service';
import { ResponseFileType } from '../../api/models/output.file.types/response-file.type';

/**
 * This service is responsible for handling CRUD operations for files.
 * It extends the BaseCrudApiService class and uses the FilesQueryRepository for querying data.
 * The CommandBus is used to execute commands related to files.
 */

@Injectable()
export class FilesCrudApiService extends BaseFilesCrudApiService<
  | UploadBackgroundWallpaperCommand
  | UploadPostMainImageCommand
  | UploadBlogMainImageCommand,
  ResponseFileType
> {
  constructor(commandBus: CommandBus) {
    super(commandBus);
  }
}
