import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { FileMetadata } from '../domain/entities/file-metadata.entity';
import { PostImage } from '../domain/entities/post-images.entity';
import { BlogImage } from '../domain/entities/blog-images.entity';

@Injectable()
export class FilesRepository {
  constructor(
    @InjectRepository(FileMetadata)
    private readonly filesMetadata: Repository<FileMetadata>,
  ) {}

  async save(
    fileMetadata: FileMetadata,
    manager: EntityManager,
  ): Promise<FileMetadata> {
    try {
      return await manager.save(FileMetadata, fileMetadata);
    } catch (error) {
      console.log(error);
      throw new Error(`file metadata is not saved: ${error}`);
    }
  }

  async uploadImage(postImage: PostImage, manager: EntityManager) {
    try {
      await manager.insert(PostImage, postImage);
    } catch (error) {
      console.error(`${error}`);
      throw new Error(`uploadImage: ${error}`);
    }
  }

  async getPostImage(
    postId: string,
    manager: EntityManager,
  ): Promise<PostImage | null> {
    try {
      return await manager.findOneBy(PostImage, { postId });
    } catch (error) {
      console.log(error);
      return null;
    }
  }
  async getBlogImage(
    blogId: string,
    manager: EntityManager,
  ): Promise<BlogImage | null> {
    try {
      return await manager.findOneBy(BlogImage, { blogId });
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async saveBlogImgs(
    dto: BlogImage,
    manager: EntityManager,
  ): Promise<BlogImage> {
    try {
      return await manager.save(BlogImage, dto);
    } catch (error) {
      console.log(error);
      throw new Error(`saveBlogImgs: ${error}`);
    }
  }

  async savePostImgs(
    dto: PostImage,
    manager: EntityManager,
  ): Promise<PostImage> {
    try {
      return await manager.save(PostImage, dto);
    } catch (error) {
      console.log(error);
      throw new Error(`savePostImgs: ${error}`);
    }
  }
}
