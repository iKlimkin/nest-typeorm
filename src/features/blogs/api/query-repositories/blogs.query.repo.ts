import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationViewModel } from '../../../../domain/sorting-base-filter';
import { getPagination } from '../../../../infra/utils/get-pagination';
import { Blog } from '../../domain/entities/blog.entity';
import { BlogsQueryFilter } from '../models/input.blog.models/blogs-query.filter';
import {
  getBlogsViewModel,
  getSABlogsViewModelFromRaw,
} from '../models/output.blog.models/getBlogs.view.model';
import {
  BlogViewModelType,
  SABlogsViewType,
} from '../models/output.blog.models/blog.view.model-type';
import { UserAccount } from '../../../../settings';

@Injectable()
export class BlogsQueryRepo {
  constructor(
    @InjectRepository(Blog) private readonly blogs: Repository<Blog>,
  ) {}

  async getAllBlogs(
    queryOptions: BlogsQueryFilter,
    adminAccess = false,
  ): Promise<PaginationViewModel<BlogViewModelType | SABlogsViewType>> {
    try {
      const { searchNameTerm } = queryOptions;

      const { pageNumber, pageSize, skip, sortBy, sortDirection } =
        getPagination(queryOptions);

      const searchTerm = `%${searchNameTerm || ''}%`;

      const queryBuilder = this.blogs.createQueryBuilder('blogs');

      queryBuilder
        .where('blogs.title ILIKE :title', { title: searchTerm })
        .orderBy(
          sortBy === 'title'
            ? 'blogs."title" COLLATE "C"'
            : sortBy === 'created_at'
            ? 'blogs.created_at'
            : `blogs.${sortBy}`,
          sortDirection,
        )
        .skip(skip)
        .take(pageSize);

      if (adminAccess) {
        queryBuilder
          .leftJoin('blogs.user', 'user')
          .addSelect(['user.id', 'user.login'])
          .limit(pageSize)
          .offset(skip);

        const rawBlogs = await queryBuilder.getRawMany();
        const blogsCount = await queryBuilder.getCount();

        return new PaginationViewModel<SABlogsViewType>(
          rawBlogs.map(getSABlogsViewModelFromRaw),
          pageNumber,
          pageSize,
          blogsCount,
        );
      }

      const [blogs, blogsCount] = await queryBuilder.getManyAndCount();

      return new PaginationViewModel<BlogViewModelType>(
        blogs.map(getBlogsViewModel),
        pageNumber,
        pageSize,
        blogsCount,
      );
    } catch (error) {
      console.error(error);
      throw new Error(
        `Some troubles occurred during find or paging blogs: ${error}`,
      );
    }
  }

  async getBlogsByBlogger(
    userId: string,
    queryOptions: BlogsQueryFilter,
  ): Promise<PaginationViewModel<BlogViewModelType>> {
    try {
      const { searchNameTerm } = queryOptions;

      const { pageNumber, pageSize, skip, sortBy, sortDirection } =
        getPagination(queryOptions);

      const searchTerm = `%${searchNameTerm || ''}%`;

      const queryBuilder = this.blogs.createQueryBuilder('blogs');

      queryBuilder
        .where('blogs.title ILIKE :title AND blogs."ownerId" = :userId', {
          title: searchTerm,
          userId,
        })
        .orderBy(
          sortBy === 'title'
            ? 'blogs."title" COLLATE "C"'
            : sortBy === 'created_at'
            ? 'blogs.created_at'
            : `blogs.${sortBy}`,
          sortDirection,
        )
        .skip(skip)
        .take(pageSize);

      const [blogs, blogsCount] = await queryBuilder.getManyAndCount();

      return new PaginationViewModel<BlogViewModelType>(
        blogs.map(getBlogsViewModel),
        pageNumber,
        pageSize,
        blogsCount,
      );
    } catch (error) {
      console.error(error);
      throw new Error(
        `Some troubles occurred during find or paging blogs by blogger: ${error}`,
      );
    }
  }

  async getById(blogId: string): Promise<BlogViewModelType | null> {
    try {
      const result = await this.blogs.findOneBy({ id: blogId });

      if (!result) return null;

      return getBlogsViewModel(result);
    } catch (error) {
      console.log(`Some troubles occurred during find blog by id${error}`);
      return null;
    }
  }

  async getBlogWithUserInfo(
    blogId: string,
  ): Promise<(BlogViewModelType & { user: UserAccount }) | null> {
    try {
      const result = await this.blogs.findOne({
        where: { id: blogId },
        relations: {
          user: true,
        },
      });

      if (!result) return null;
      const viewModel = getBlogsViewModel(result);
      viewModel['user'] = result.user;

      return viewModel as BlogViewModelType & { user: UserAccount };
    } catch (error) {
      console.log(`Some troubles occurred during find blog by id${error}`);
      return null;
    }
  }
}
