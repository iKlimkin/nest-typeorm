import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PaginationViewModel } from '../../../../domain/sorting-base-filter';
import { BaseModel } from '../../../../infra/utils/base-query-pagination-model';
import { getPagination } from '../../../../infra/utils/get-pagination';
import { getSearchTerm } from '../../../../infra/utils/search-term-finder';
import { Blog, BlogModelType } from '../../domain/entities/blog.schema';
import { BlogViewModelType } from '../models/output.blog.models/blog.view.model-type';
import { BlogDBType, BlogType } from '../models/output.blog.models/blog.models';
import { BlogsQueryFilter } from '../models/input.blog.models/blogs-query.filter';
import { ObjectId } from 'mongodb';
import { Types } from 'mongoose';

@Injectable()
export class BlogsQueryRepo {
  constructor(@InjectModel(Blog.name) private BlogModel: BlogModelType) {}

  async getAllBlogs(
    inputData: BlogsQueryFilter,
  ): Promise<PaginationViewModel<BlogType>> {
    try {
      const blogModel = new this.BlogModel();

      return BaseModel.paginateAndTransform<BlogDBType, BlogViewModelType>(
        this.BlogModel,
        blogModel.getBlogsViewModel,
        inputData,
      );
    } catch (e) {
      throw new Error(
        `There're something problems with find blogs by query: ${e}`,
      );
    }
  }

  async getBlogById(blogId: string): Promise<BlogViewModelType | null> {
    try {
      const foundedBlog = await this.BlogModel.findById(new ObjectId(blogId));

      if (!foundedBlog) return null;

      return foundedBlog.getBlogsViewModel(foundedBlog);
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async getBlogsByQuery(
    inputData: BlogsQueryFilter,
  ): Promise<PaginationViewModel<BlogViewModelType>> {
    const { searchNameTerm } = inputData;
    const { pageNumber, pageSize, sort, skip } = getPagination(inputData);

    const filter = getSearchTerm({ searchNameTerm });

    try {
      const blogs = await this.BlogModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(pageSize);

      const totalCount = await this.BlogModel.countDocuments(filter);

      const blogModel = new this.BlogModel();

      const blogsViewModel = new PaginationViewModel<BlogViewModelType>(
        blogs.map(blogModel.getBlogsViewModel),
        pageNumber,
        pageSize,
        totalCount,
      );

      return blogsViewModel;
    } catch (e) {
      throw new Error(`There're something problems with find blogs: ${e}`);
    }
  }
}
