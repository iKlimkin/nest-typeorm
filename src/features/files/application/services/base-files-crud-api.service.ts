import { CommandBus } from '@nestjs/cqrs';
import {
  LayerNoticeInterceptor,
  handleErrors,
} from '../../../posts/api/controllers';

export class BaseFilesCrudApiService<TCommand, TData> {
  constructor(private readonly commandBus: CommandBus) {}
  async create(command: TCommand): Promise<TData> {
    const notification = await this.commandBus.execute<
      TCommand,
      LayerNoticeInterceptor<TData>
    >(command);

    if (notification.hasError) {
      const { error } = handleErrors(
        notification.code,
        notification.extensions[0],
      );
      throw error;
    }

    // return this.queryRepo.getById(notification.data.id);
    return notification.data;
  }
}
