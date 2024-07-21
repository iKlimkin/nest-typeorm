import { Injectable } from '@nestjs/common';
import { PostsRepository } from '../infrastructure/posts.repository';
import { UsersRepository } from '../../admin/infrastructure/users.repo';
import { UserAccount } from '../../auth/infrastructure/settings';
import { Post } from '../domain/entities/post.entity';
import { LayerNoticeInterceptor } from '../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { GetErrors } from '../../../infra/utils/interlay-error-handler.ts/error-constants';

@Injectable()
export class PostsService {
  private readonly location: string;
  constructor(
    private readonly userRepo: UsersRepository,
    private readonly postRepo: PostsRepository,
  ) {
    this.location = this.constructor.name;
  }

  async getAndCheckUserRightsToCreateComment(
    userId: string,
    postId: string,
  ): Promise<
    LayerNoticeInterceptor<{
      user: UserAccount;
      post: Post;
    }>
  > {
    const notice = new LayerNoticeInterceptor<{
      user: UserAccount;
      post: Post;
    }>();

    const post = await this.postRepo.getPost(postId);
    if (!post) {
      notice.addError('Post not found', this.location, GetErrors.NotFound);
      return notice;
    }

    const userWithBanInfo = await this.userRepo.getUserWithBanInfo(
      userId,
      post.blogId,
    );
    
    if (!userWithBanInfo) {
      notice.addError(
        `User doesn't have permissions`,
        this.location,
        GetErrors.Forbidden,
      );
      return notice;
    } else {
      notice.addData({ user: userWithBanInfo as UserAccount, post });
    }
    return notice;
  }
}
