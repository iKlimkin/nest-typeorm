import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UpdatePostModel } from '../api/models/input.posts.models/update.post.model';
import { PostDBType } from '../api/models/post.view.models/post-view.model';
import {
  Post,
  PostDocument,
  PostModelType,
} from '../domain/entities/posts.schema';
import { OutputId, likeUserInfo } from '../../../domain/likes.types';
import { ObjectId } from 'mongodb';

@Injectable()
export class PostsRepository {
  constructor(
    @InjectModel(Post.name) private readonly PostModel: PostModelType,
  ) {}

  async save(postSmartModel: PostDocument): Promise<OutputId> {
    try {
      const post = await postSmartModel.save();

      return {
        id: post._id.toString(),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Database fails during save operate',
      );
    }
  }

  async updatePost(
    postId: string,
    updateData: UpdatePostModel,
  ): Promise<boolean> {
    try {
      const post = await this.PostModel.updateOne(
        {
          $and: [
            { _id: this.getObjectId(postId) },
            { blogId: updateData.blogId },
          ],
        },
        {
          $set: {
            title: updateData.title,
            shortDescription: updateData.shortDescription,
            content: updateData.content,
            blogId: updateData.blogId,
          },
        },
      );

      return post.matchedCount === 1;
    } catch (error) {
      throw new InternalServerErrorException(
        'Database fails during update operate',
      );
    }
  }

  private getObjectId(id: string) {
    return new ObjectId(id);
  }

  async createLikeStatus(likeInfo: likeUserInfo): Promise<boolean> {
    try {
      const createdLikeStatus = await this.PostModel.findByIdAndUpdate(
        new ObjectId(likeInfo.postId),
        {
          $addToSet: {
            likesUserInfo: {
              userId: likeInfo.userId,
              status: likeInfo.status,
              login: likeInfo.login,
              addedAt: new Date().toISOString(),
            },
          },
          $inc: {
            'likesCountInfo.likesCount': likeInfo.likesCount,
            'likesCountInfo.dislikesCount': likeInfo.dislikesCount,
          },
        },
        { new: true },
      );

      return createdLikeStatus !== null;
    } catch (error) {
      throw new InternalServerErrorException(
        'Database fails during create like-status operate',
      );
    }
  }

  async updateLikeStatus(likeInfo: likeUserInfo): Promise<PostDBType | null> {
    try {
      return this.PostModel.findOneAndUpdate(
        {
          _id: likeInfo.postId,
          likesUserInfo: { $elemMatch: { userId: likeInfo.userId } },
        },
        {
          $set: {
            'likesUserInfo.$.status': likeInfo.status,
          },

          $inc: {
            'likesCountInfo.likesCount': likeInfo.likesCount,
            'likesCountInfo.dislikesCount': likeInfo.dislikesCount,
          },
        },

        { new: true },
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'Database fails during update operate',
      );
    }
  }

  async deletePost(searchId: string): Promise<boolean> {
    try {
      return this.PostModel.findByIdAndDelete(new ObjectId(searchId)).lean();
    } catch (error) {
      throw new InternalServerErrorException(
        'Database fails during delete operate',
      );
    }
  }
}
