import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { likesStatus } from '../../../../domain/likes.types';
import { PaginationViewModel } from '../../../../domain/sorting-base-filter';
import { getPagination } from '../../../../infra/utils/get-pagination';
import { getSearchTerm } from '../../../../infra/utils/search-term-finder';
import { Post, PostModelType } from '../../domain/entities/posts.schema';
import { PostsQueryFilter } from '../models/output.post.models/posts-query.filter';
import { PostViewModelType } from '../models/post.view.models/post-view-model.type';
import { getPostViewModel } from '../models/post.view.models/post-view.model';

@Injectable()
export class PostsQueryRepository {
  constructor(@InjectModel(Post.name) private PostModel: PostModelType) {}

  async getAllPosts(
    inputData: PostsQueryFilter,
    userId?: string,
  ): Promise<PaginationViewModel<PostViewModelType>> {
    const { pageNumber, pageSize, sort, skip } = getPagination(inputData);
    const { searchContentTerm } = inputData;

    const filter = getSearchTerm({ searchContentTerm });

    try {
      const posts = await this.PostModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(pageSize)
        .lean()
        .exec();

      const totalCount = await this.PostModel.countDocuments(filter);
      const pagesCount = Math.ceil(totalCount / pageSize);

      return {
        pagesCount,
        page: pageNumber,
        pageSize,
        totalCount,
        items: posts.map((post) => getPostViewModel(post, userId)),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Database fails operate with find posts',
      );
    }
  }

  async getPostsByBlogId(
    blogId: string,
    inputData: PostsQueryFilter,
    userId?: string,
  ): Promise<PaginationViewModel<PostViewModelType>> {
    const { pageNumber, pageSize, sort, skip } = getPagination(inputData);
    const filter = getSearchTerm({
      searchContentTerm: inputData.searchContentTerm,
    });

    try {
      const posts = await this.PostModel.find({
        blogId,
        ...filter,
      })
        .sort(sort)
        .skip(skip)
        .limit(pageSize);

      const totalCount = await this.PostModel.countDocuments({
        blogId,
        ...filter,
      });
      const pagesCount = Math.ceil(totalCount / pageSize);

      return {
        pagesCount: pagesCount,
        page: pageNumber,
        pageSize: pageSize,
        totalCount: totalCount,
        items: posts.map((p) => getPostViewModel(p, userId)),
      };
    } catch (e) {
      throw new InternalServerErrorException(
        'Database fails operation with find post by blogId',
      );
    }
  }

  async getUserReactions(
    userId: string,
    postId: string,
  ): Promise<likesStatus | null> {
    try {
      const foundedUserReaction = await this.PostModel.findById(
        new ObjectId(postId),
        {
          likesUserInfo: {
            $elemMatch: {
              userId,
              status: { $exists: true },
            },
          },
        },
      );

      if (!foundedUserReaction) return null;

      return foundedUserReaction.likesUserInfo[0].status;
    } catch (error) {
      console.error(`Database fails operate with find user's reactions`);
      return null;
    }
  }

  async getPostById(
    postId: string,
    userId?: string,
  ): Promise<PostViewModelType | null> {
    try {
      const foundedPost = await this.PostModel.findById(new ObjectId(postId));

      if (!foundedPost) return null;

      return getPostViewModel(foundedPost, userId);
    } catch (error) {
      console.error(`Database fails operate during find post ${error}`);
      return null;
    }
  }
}
