import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SortDirections } from '../../../../domain/sorting-base-filter';
import {
  FileMetadata,
  PhotoType,
} from '../../domain/entities/file-metadata.entity';
import {
  FileMetaPostViewModelType,
  filesBlogMetaViewModel,
  filesBlogPostMetaViewModel,
  FilesMetaBlogViewModelType,
} from '../models/file-view.model';

@Injectable()
export class FilesQueryRepository {
  constructor(
    @InjectRepository(FileMetadata)
    private readonly filesMetadata: Repository<FileMetadata>,
  ) {}

  async getBlogImages(blogId: string): Promise<FilesMetaBlogViewModelType> {
    try {
      const blogWallpaperImg = await this.filesMetadata
        .createQueryBuilder('fm')
        .select(['fm.fileUrl', 'fm.fileWidth', 'fm.fileHeight', 'fm.fileSize'])
        .where('fm.photoType = :type', { type: PhotoType.WALLPAPER })
        .leftJoin('fm.blogImage', 'bImgs')
        .andWhere('bImgs.blogId = :blogId', { blogId })
        .getOne();

      const blogMainImgs = await this.filesMetadata
        .createQueryBuilder('fm')
        .select(['fm.fileUrl', 'fm.fileWidth', 'fm.fileHeight', 'fm.fileSize'])
        .where('fm.photoType = :type', { type: PhotoType.MAIN })
        .leftJoin('fm.blogImage', 'bImgs')
        .andWhere('bImgs.blogId = :blogId', { blogId })
        .orderBy('fm.created_at', SortDirections.DESC)
        .limit(18)
        .getMany();

      return filesBlogMetaViewModel(blogWallpaperImg, blogMainImgs);
      return;
    } catch (error) {
      console.log(error);
      throw new Error(`file metadata is not saved: ${error}`);
    }
  }
  async getBlogPostImages(postId: string): Promise<FileMetaPostViewModelType> {
    try {
      const postMainImages = await this.filesMetadata
        .createQueryBuilder('fm')
        .select(['fm.fileUrl', 'fm.fileWidth', 'fm.fileHeight', 'fm.fileSize'])
        .where('fm.photoType = :type', { type: PhotoType.MAIN })
        .leftJoin('fm.postImage', 'pImg')
        .where('pImg.postId = :postId', { postId })
        .orderBy('fm.created_at', SortDirections.DESC)
        .limit(18)
        .getMany();

      return filesBlogPostMetaViewModel(postMainImages);
    } catch (error) {
      console.log(error);
      throw new Error(`file metadata is not saved: ${error}`);
    }
  }
}
