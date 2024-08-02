import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { FileValidator } from '@nestjs/common/pipes/file/file-validator.interface';
import { IFile } from '@nestjs/common/pipes/file/interfaces';
import sizeOf from 'image-size';
import { saveFile } from '../../../../infra/utils/fs-utils';

export interface CustomUploadTypeValidatorOptions {
  fileTypes: string[];
  imageSize?: number;
  imageWidth: number;
  imageHeight: number;
}

const _validUploadsMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];

interface FileInterface extends Express.Multer.File {}

export class FileDimensionsValidatePipe extends FileValidator {
  constructor(private readonly options: CustomUploadTypeValidatorOptions) {
    super(options);
  }

  isValid<TFile extends IFile>(file?: TFile): boolean | Promise<boolean> {
    console.log({ validateOptions: this.validationOptions });

    if (!this.validationOptions) return true;
    if (!file) return false;

    const imageSize = this.options?.imageSize || 1024 * 100;
    const validMimeTypes = this.options.fileTypes.join(', ');

    if (file.size > imageSize) return false;

    if (!_validUploadsMimeTypes.includes(validMimeTypes)) return false;

    const { width, height } = sizeOf((file as unknown as FileInterface).buffer);
    if (width! > this.options.imageWidth || height! > this.options.imageHeight)
      return false;

    return true;
  }

  buildErrorMessage(file: Express.Multer.File): string {
    if (!file) return 'File is required';
    const imageSize = this.options.imageSize || 1024 * 100;
    const validMimeTypes = this.options.fileTypes.join(', ');

    if (file.size > imageSize)
      return `File is too large. Maximum size is ${imageSize} bytes.`;

    if (!_validUploadsMimeTypes.includes(file.mimetype))
      return `Invalid file type. Only ${validMimeTypes} are allowed.`;

    const { width, height } = sizeOf(file.buffer);
    if (width !== 1028 || height !== 312)
      return `Invalid image dimensions. Required dimensions are 1028x312 pixels.`;

    return 'File is valid.';
  }
}

export class FileDimensionsValidationPipe implements PipeTransform {
  constructor(private readonly fileOptions: CustomUploadTypeValidatorOptions) {}

  async transform(file: Express.Multer.File, metadata: ArgumentMetadata) {
    if (!file) throw new BadRequestException('File is required');

    this.validateFileSizeAndMimeType(file.size, file.mimetype);

    const { width, height } = this.validateFileDimensions(file.buffer);

    Object.assign(file, { width, height });
    return file as FileDimensionType;
  }

  private validateFileSizeAndMimeType = (size: number, mimetype: string) => {
    const { fileTypes } = this.fileOptions;
    const imageSize = this.fileOptions?.imageSize || 1024 * 100;

    if (size > imageSize) {
      throw new BadRequestException(
        `File is too large. Maximum size is ${imageSize} bytes.`,
      );
    }

    if (!fileTypes.includes(mimetype))
      throw new BadRequestException(
        `Invalid file type. Only ${fileTypes.join(', ')} are allowed.`,
      );
  };

  private validateFileDimensions = (buffer: Buffer) => {
    try {
      const { width, height } = sizeOf(buffer);
      if (
        width! !== this.fileOptions.imageWidth ||
        height! !== this.fileOptions.imageHeight
      ) {
        throw new BadRequestException(
          `Invalid image dimensions. Maximum allowed dimensions are ${this.fileOptions.imageWidth}x${this.fileOptions.imageHeight} pixels.`,
        );
      }

      return { width, height };
    } catch (error) {
      throw new BadRequestException(`Invalid image dimensions.`);
    }
  };
}

export type FileDimensionType = Express.Multer.File & {
  width: number;
  height: number;
};
