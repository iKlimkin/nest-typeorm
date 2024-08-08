import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { BaseCrudApiServiceOnlyErrors } from '../../../../domain/base-services/base-crud-api-errors.service';
import { SubscribeBlogCommand } from '../use-case/commands/subscribe-blog.command';
import { UnsubscribeBlogCommand } from '../use-case/commands/unSubscribe-blog.command';

@Injectable()
export class BlogsCrudApiService extends BaseCrudApiServiceOnlyErrors<
  SubscribeBlogCommand | UnsubscribeBlogCommand
> {
  constructor(commandBus: CommandBus) {
    super(commandBus);
  }
}
