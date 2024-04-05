import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UpdateBlogModel } from '../api/models/input.blog.models/update-blog-models';
import { BlogDBType } from '../api/models/output.blog.models/blog.models';
import {
  Blog,
  BlogDocument,
  BlogModelType,
} from '../domain/entities/blog.schema';
import { OutputId } from '../../../domain/likes.types';
import { ObjectId } from 'mongodb';

export interface IBlogsRepository {
  save(smartBlogModel: BlogDocument): Promise<OutputId>;
  getBlogById(blogId: string): Promise<BlogDBType | null>;

  updateBlog(blogId: string, updateData: UpdateBlogModel): Promise<boolean>;

  deleteBlog(blogId: string): Promise<BlogDBType>;
}

@Injectable()
export class BlogsRepository implements IBlogsRepository {
  constructor(@InjectModel(Blog.name) private BlogModel: BlogModelType) {}

  async save(smartBlogModel: BlogDocument): Promise<OutputId> {
    try {
      const blogDb = await smartBlogModel.save();

      return {
        id: blogDb._id.toString(),
      };
    } catch (error) {
      console.error(`Database fails operate during the creation blog`, error);
      throw new Error();
    }
  }

  async getBlogById(blogId: string): Promise<BlogDBType | null> {
    try {
      const foundedBlog = await this.BlogModel.findById(
        new ObjectId(blogId),
      ).lean();

      if (!foundedBlog) return null;

      return {
        ...foundedBlog,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Database fails operate during the find blog',
      );
    }
  }

  async updateBlog(
    blogId: string,
    updateData: UpdateBlogModel,
  ): Promise<boolean> {
    try {
      const result = await this.BlogModel.updateOne(
        { _id: new ObjectId(blogId) },
        {
          $set: {
            name: updateData.name,
            description: updateData.description,
            websiteUrl: updateData.websiteUrl,
          },
        },
      );
      return result.matchedCount === 1;
    } catch (e) {
      console.error(`Database fails operate during the upgrade blog`, e);
      return false;
    }
  }

  async deleteBlog(blogId: string): Promise<BlogDBType> {
    try {
      return this.BlogModel.findByIdAndDelete(new ObjectId(blogId)).lean();
    } catch (error) {
      throw new InternalServerErrorException(
        'Database fails operate during removal operation',
      );
    }
  }
}
