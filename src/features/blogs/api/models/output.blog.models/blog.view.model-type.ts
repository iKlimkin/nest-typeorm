import { LikesStatuses } from '../../../../../domain/reaction.models';
import { BanUserInfo } from '../../../../admin/api/models/user.view.models/userAdmin.view-type';
import {
  FilesMetaBlogViewModelType,
  RawImageMetaType,
} from '../../../../files/api/models/file-view.model';
import { Blog } from '../../../domain/entities/blog.entity';

export type BlogViewModelType = {
  /**
   * id of the existing blog
   */
  id: string;

  /**
   *  blog's name
   */
  name: string;

  /**
   * description of the blog
   */
  description: string;

  /**
   * websiteUrl of existing blog
   */
  websiteUrl: string;

  /**
   * blog is created
   */
  createdAt: string;

  /**
   * is a member of the blog
   */
  isMembership: boolean;

  images: FilesMetaBlogViewModelType;

  currentUserSubscriptionStatus?: SubscribeEnum;
  subscribersCount?: number;
};

export enum SubscribeEnum {
  Subscribed = 'Subscribed',
  Unsubscribed = 'Unsubscribed',
  None = 'None',
}

export type BlogOwnerInfoType = { userId: string; userLogin: string };

export type SABlogsViewType = Omit<BlogViewModelType, 'images'> & {
  blogOwnerInfo: BlogOwnerInfoType;
  banInfo: Omit<BanUserInfo, 'banReason'>;
};

export type BlogViewModelTypeWithImages = BlogViewModelType & {
  images: FilesMetaBlogViewModelType;
};

export type ImageInfoType = RawImageMetaType & {
  photoType: string;
};

export type RawBlogImagesType = Partial<Blog> & {
  images: ImageInfoType[];
};

export type AllCommentsForUserBlogsViewType = {
  id: string;
  content: string;
  commentatorInfo: {
    userId: string;
    userLogin: string;
  };
  createdAt: string;
  likesInfo: {
    likesCount: number;
    dislikesCount: number;
    myStatus: LikesStatuses;
  };
  postInfo: {
    id: string;
    title: string;
    blogId: string;
    blogName: string;
  };
};
