import { LikesStatuses } from '../../../../../domain/reaction.models';
import { Comment } from '../../../../comments/domain/entities/comment.entity';
import { FilesMetaBlogViewModelType } from '../../../../files/api/models/file-view.model';
import { Blog } from '../../../domain/entities/blog.entity';
import {
  AllCommentsForUserBlogsViewType,
  BlogViewModelType,
  BlogViewModelTypeWithImages,
  ImageInfoType,
  RawBlogImagesType,
  SABlogsViewType,
  SubscribeEnum,
} from './blog.view.model-type';

export const getBlogsViewModel = (blog: Blog): BlogViewModelType => ({
  id: blog.id,
  name: blog.title,
  description: blog.description,
  websiteUrl: blog.websiteUrl,
  createdAt: blog.created_at.toISOString(),
  isMembership: false,
  images: blog.images
    ? convertImagesToView(blog.images as unknown as ImageInfoType[])
    : { wallpaper: null, main: [] },
});

export const getBlogsViewModelNew = (
  blog: Blog & { subscribersCount: string; subscribeStatus: SubscribeEnum },
): BlogViewModelType => ({
  id: blog.id,
  name: blog.title,
  description: blog.description,
  websiteUrl: blog.websiteUrl,
  createdAt: blog.created_at.toISOString(),
  isMembership: blog.isMembership || false,
  images: blog.images
    ? convertImagesToView(blog.images as unknown as ImageInfoType[])
    : { wallpaper: null, main: [] },
  currentUserSubscriptionStatus: blog.subscribeStatus || SubscribeEnum.None,
  subscribersCount: +blog.subscribersCount || 0,
});

export const convertImagesToView = (
  images: ImageInfoType[],
): FilesMetaBlogViewModelType => {
  const wallpaperInfo = images.find((image) => image.photoType === 'wallpaper');
  const wallpaper = wallpaperInfo
    ? {
        url: wallpaperInfo?.fileUrl,
        fileSize: +wallpaperInfo?.fileSize,
        height: +wallpaperInfo?.fileHeight,
        width: +wallpaperInfo?.fileWidth,
      }
    : null;

  const main = images
    .filter((image) => image.photoType === 'main')
    .map((img) => ({
      url: img.fileUrl,
      fileSize: +img.fileSize,
      height: +img.fileHeight,
      width: +img.fileWidth,
    }));

  return { wallpaper, main };
};
export const getBlogsViewModelWithImages = (
  blog: RawBlogImagesType,
): BlogViewModelTypeWithImages => ({
  id: blog.id,
  name: blog.title,
  description: blog.description,
  websiteUrl: blog.websiteUrl,
  createdAt: blog.created_at.toISOString(),
  isMembership: false,
  images: blog.images
    ? convertImagesToView(blog.images)
    : { wallpaper: null, main: [] },
});

export const getSABlogsViewModelFromRaw = (rawBlog: any): SABlogsViewType => ({
  id: rawBlog.id,
  name: rawBlog.title,
  description: rawBlog.description,
  websiteUrl: rawBlog.websiteUrl,
  createdAt: rawBlog.created_at.toISOString(),
  isMembership: false,
  blogOwnerInfo: {
    userId: rawBlog?.userId,
    userLogin: rawBlog?.userLogin,
  },
  banInfo: {
    isBanned: rawBlog.isBanned,
    banDate: rawBlog?.banDate?.toISOString() || null,
  },
});

export const getSACommentsForBlogsCurrentUserViewModelFromRaw = (
  comment: Comment,
): AllCommentsForUserBlogsViewType => ({
  id: comment.id,
  content: comment.content,
  commentatorInfo: {
    userId: comment.user.id,
    userLogin: comment.userLogin,
  },
  createdAt: comment.created_at.toISOString(),
  likesInfo: {
    likesCount: comment.commentReactionCounts.likes_count,
    dislikesCount: comment.commentReactionCounts.dislikes_count,
    myStatus: comment.commentReactions[0]?.reactionType || LikesStatuses.None,
  },
  postInfo: {
    blogId: comment.post.blogId,
    blogName: comment.post.blogTitle,
    id: comment.post.id,
    title: comment.post.title,
  },
});
