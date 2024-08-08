import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  BaseCrudApiService,
  BaseViewModel,
} from '../../../domain/base-services/base.crud.api.service';
import { UsersQueryRepo } from '../api/query-repositories/users.query.repo';

@Injectable()
export class BloggerCrudApiService<TCommand> extends BaseCrudApiService<
  TCommand,
  BaseViewModel
> {
  constructor(commandBus: CommandBus, usersQueryRepo: UsersQueryRepo) {
    super(commandBus, usersQueryRepo);
  }
}
