import { CommandBus } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { SAViewType } from '../../features/admin/api/models/user.view.models/userAdmin.view-type';
import { UsersQueryRepo } from '../../features/admin/api/query-repositories/users.query.repo';
import { LayerNoticeInterceptor } from '../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { handleErrors } from '../../infra/utils/interlay-error-handler.ts/interlay-errors.handler';
import { BlogsQueryRepo } from '../../features/blogs/api/query-repositories/blogs.query.repo';
import { BlogViewModelType } from '../../features/blogs/api/models/output.blog.models/blog.view.model-type';
import { PostViewModelType } from '../../features/posts/api/models/post.view.models/post-view-model.type';
import { PostsQueryRepo } from '../../features/posts/api/query-repositories/posts.query.repo';
import { CommentsViewModel } from '../../features/comments/api/models/comments.view.models/comments.view-model.type';
import { FeedbacksQueryRepo } from '../../features/comments/api/query-repositories/feedbacks.query.repo';

export interface BaseQueryRepository<T> {
  getById: (id: string) => Promise<T>;
}

export interface BaseViewModel {
  id?: string;
}

export class BaseCrudApiService<TCommand, TViewModel> {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryRepo: BaseQueryRepository<TViewModel>,
  ) {}
  async create(command: TCommand): Promise<TViewModel> {
    const notification = await this.commandBus.execute<
      TCommand,
      LayerNoticeInterceptor<TViewModel & BaseViewModel>
    >(command);

    if (notification.hasError) {
      const { error } = handleErrors(
        notification.code,
        notification.extensions[0],
      );
      throw error;
    }

    return this.queryRepo.getById(notification.data.id);
  }
  async updateOrDelete(command: TCommand): Promise<void> {
    const notification = await this.commandBus.execute<
      TCommand,
      LayerNoticeInterceptor
    >(command);

    if (notification.hasError) {
      const { error } = handleErrors(
        notification.code,
        notification.extensions[0],
      );
      throw error;
    }
  }
}

@Injectable()
export class SACrudApiService<TCommand> extends BaseCrudApiService<
  TCommand,
  SAViewType
> {
  constructor(commandBus: CommandBus, usersQueryRepo: UsersQueryRepo) {
    super(commandBus, usersQueryRepo);
  }
}

@Injectable()
export class PostCrudApiService<TCommand> extends BaseCrudApiService<
  TCommand,
  CommentsViewModel
> {
  constructor(commandBus: CommandBus, queryRepo: FeedbacksQueryRepo) {
    super(commandBus, queryRepo);
  }
}

@Injectable()
export class BlogCrudApiService<TCommand> extends BaseCrudApiService<
  TCommand,
  BlogViewModelType
> {
  constructor(commandBus: CommandBus, queryRepo: BlogsQueryRepo) {
    super(commandBus, queryRepo);
  }
}

@Injectable()
export class BlogPostsCrudApiService<TCommand> extends BaseCrudApiService<
  TCommand,
  PostViewModelType
> {
  constructor(commandBus: CommandBus, queryRepo: PostsQueryRepo) {
    super(commandBus, queryRepo);
  }
}
