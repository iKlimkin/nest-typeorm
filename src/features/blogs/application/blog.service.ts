import { Injectable } from '@nestjs/common';
import { LayerNoticeInterceptor } from '../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { BlogsRepository } from '../infrastructure/blogs.repository';
import { GetErrors } from '../../../infra/utils/interlay-error-handler.ts/error-constants';
import { UsersRepository } from '../../admin/infrastructure/users.repo';
import { Blog } from '../domain/entities/blog.entity';
import { UserAccount } from '../../admin/domain/entities/user-account.entity';
import { PostsRepository } from '../../posts/infrastructure/posts.repository';
import { Post } from '../../posts/domain/entities/post.entity';

type BlogAndUserResponse = {
  blog: Blog;
  user: UserAccount;
  post?: Post;
};
@Injectable()
export class BlogService {
  private readonly location: string;
  constructor(
    private readonly blogRepo: BlogsRepository,
    private readonly userRepo: UsersRepository,
    private readonly postRepo: PostsRepository,
  ) {
    this.location = this.constructor.name;
  }

  async validateBlogAndUserRights(
    blogId: string,
    userId: string,
    postId?: string,
  ): Promise<LayerNoticeInterceptor<BlogAndUserResponse>> {
    const notice = new LayerNoticeInterceptor<BlogAndUserResponse>();

    let post: Post;

    if (postId) {
      post = await this.postRepo.getPost(postId);
      if (!post) {
        notice.addError(
          `Post with id ${postId} not found`,
          this.location,
          GetErrors.NotFound,
        );
        return notice;
      }
    }

    const blog = await this.blogRepo.getBlogById(blogId);
    const user = await this.userRepo.getUserById(userId);

    if (!blog) {
      notice.addError(
        `Blog with id ${blogId} not found`,
        this.location,
        GetErrors.NotFound,
      );
      return notice;
    }

    if (blog.user?.id !== user?.id) {
      notice.addError(
        `User with id ${userId} doesn't have change rights`,
        this.location,
        GetErrors.Forbidden,
      );
      return notice;
    }

    const noticeData = { blog, user };
    if (post) noticeData['post'] = post;

    notice.addData(noticeData);
    return notice;
  }
}
