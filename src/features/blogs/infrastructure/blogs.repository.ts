import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { OutputId } from '../api/controllers';
import { UpdateBlogDto } from '../api/models/input.blog.models/update-blog-models';
import { Blog } from '../domain/entities/blog.entity';

@Injectable()
export class BlogsRepository {
  constructor(
    @InjectRepository(Blog) private readonly blogs: Repository<Blog>,
  ) {}

  async save(blogDto: Blog, manager: EntityManager): Promise<Blog> {
    try {
      return await manager.save(Blog, blogDto);
    } catch (error) {
      throw new Error(`blog is not saved: ${error}`);
    }
  }
  async getBlogById(blogId: string): Promise<Blog | null> {
    try {
      return await this.blogs.findOne({
        where: {
          id: blogId,
        },
        relations: {
          user: true,
        },
      });
    } catch (error) {
      console.log(`Database fails operate during get blog by id ${error}`);
      return null;
    }
  }

  async updateBlog(updateBlogDto: UpdateBlogDto): Promise<boolean> {
    try {
      const { blogId, description, name, websiteUrl } = updateBlogDto;

      const result = await this.blogs.update(
        { id: blogId },
        { title: name, description, websiteUrl },
      );

      return result.affected !== 0;
    } catch (e) {
      console.error(`Database fails operate during the upgrade blog`, e);
      return false;
    }
  }

  async deleteBlog(blogId: string, manager: EntityManager): Promise<boolean> {
    try {
      const result = await manager.delete(Blog, { id: blogId });

      return result.affected !== 0;
    } catch (error) {
      throw new Error(`Database fails operate during the delete blog ${error}`);
    }
  }
}
