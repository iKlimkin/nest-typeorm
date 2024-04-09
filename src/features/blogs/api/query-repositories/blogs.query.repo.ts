import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationViewModel } from '../../../../domain/sorting-base-filter';
import { getPagination } from '../../../../infra/utils/get-pagination';
import { Blog } from '../../domain/entities/blog.entity';
import { BlogsQueryFilter } from '../models/input.blog.models/blogs-query.filter';
import { getBlogsViewModel } from '../models/output.blog.models/getBlogs.view.model';
import { BlogViewModelType } from '../models/output.blog.models/blog.view.model-type';

@Injectable()
export class BlogsQueryRepo {
  constructor(
    @InjectRepository(Blog) private readonly blogs: Repository<Blog>
  ) {}

  async getAllBlogs(
    queryOptions: BlogsQueryFilter
  ): Promise<PaginationViewModel<BlogViewModelType> | null> {
    try {
      const { searchNameTerm } = queryOptions;

      const { pageNumber, pageSize, skip, sortBy, sortDirection } =
        getPagination(queryOptions);

      const searchTerm = `%${searchNameTerm ? searchNameTerm : ''}%`;

      const queryBuilder = this.blogs.createQueryBuilder('blogs');

      queryBuilder
        .where('blogs.title ILIKE :title', { title: searchTerm })
        .orderBy(
          sortBy === 'title'
            ? 'blogs.title COLLATE "C"'
            : sortBy === 'created_at'
              ? 'blogs.created_at'
              : `blogs.${sortBy}`,
          sortDirection
        )
        .skip(skip)
        .take(pageSize);

      const result = await queryBuilder.getManyAndCount();

      const blogs = result[0];
      const blogsCount = result[1];

      const blogsViewModel = new PaginationViewModel<BlogViewModelType>(
        blogs.map(getBlogsViewModel),
        pageNumber,
        pageSize,
        blogsCount
      );

      return blogsViewModel;
    } catch (e) {
      // throw new InternalServerErrorException(`Some troubles occurred during find blogs: ${e}`)
      console.error(`Some troubles occurred during find blogs: ${e}`);
      return null;
    }
  }

  async getBlogById(blogId: string): Promise<BlogViewModelType | null> {
    try {
      const result = await this.blogs.findOneBy({ id: blogId });

      if (!result) return null;

      return getBlogsViewModel(result);
    } catch (error) {
      console.error(`Some troubles occurred during find blog by id${error}`);
      return null;
    }
  }
}
