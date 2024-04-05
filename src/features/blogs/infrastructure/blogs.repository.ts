import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OutputId } from '../../../domain/likes.types';
import { Blog } from '../domain/entities/blog.entity';
import { BlogCreationDto } from '../api/models/dto/blog-dto.model';
import { UpdateBlogDto } from '../api/models/input.blog.models/update-blog-models';

@Injectable()
export class BlogsRepository {
  constructor(
    @InjectRepository(Blog) private readonly blogs: Repository<Blog>,
  ) {}

  async createBlog(blogDto: BlogCreationDto): Promise<OutputId | null> {
    try {
      const blog = this.blogs.create({
        title: blogDto.title,
        description: blogDto.description,
        website_url: blogDto.websiteUrl,
        is_membership: blogDto.isMembership,
      });

      const result = await this.blogs.save(blog);

      return {
        id: result.id,
      };
    } catch (error) {
      console.error(`Database fails operate during creation blog ${error}`);
      return null;
    }
  }

  async getBlogById(blogId: string): Promise<Blog | null> {
    try {
      const result = await this.blogs.findOneBy({ id: blogId });

      if (!result) return null;

      return result;
    } catch (error) {
      console.error(`Database fails operate during get blog by id ${error}`);
      return null;
    }
  }

  async updateBlog(updateBlogDto: UpdateBlogDto): Promise<boolean> {
    try {
      const { blogId, description, name, websiteUrl } = updateBlogDto;

      const result = await this.blogs.update(
        { id: blogId },
        { title: name, description, website_url: websiteUrl },
      );

      return result.affected !== 0;
    } catch (e) {
      console.error(`Database fails operate during the upgrade blog`, e);
      return false;
    }
  }

  async deleteBlog(blogId: string): Promise<boolean> {
    try {
      const result = await this.blogs.delete({ id: blogId });

      return result.affected !== 0;
    } catch (error) {
      console.error(`Database fails operate during the delete blog`, error);
      return false;
    }
  }
}
