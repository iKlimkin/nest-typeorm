import { CommandBus } from '@nestjs/cqrs';
import { BaseViewModel } from '../../../settings';
import {
  BlogViewModelType,
  BlogsQueryRepo,
  LayerNoticeInterceptor,
  PostViewModelType,
  PostsQueryRepo,
  handleErrors,
} from '../api/controllers';
import { Injectable } from '@nestjs/common';

export interface BaseQueryRepository<T> {
  getById: (id: string) => Promise<T>;
}

export class BaseCrudApiService<TCommand, TViewModel extends BaseViewModel> {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryRepo: BaseQueryRepository<TViewModel>,
  ) {}
  async create(command: TCommand): Promise<TViewModel> {
    const notification = await this.commandBus.execute<
      TCommand,
      LayerNoticeInterceptor<TViewModel>
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
      LayerNoticeInterceptor<boolean>
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




