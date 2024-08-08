import { CommandBus } from '@nestjs/cqrs';
import {
  LayerNoticeInterceptor,
  handleErrors,
} from '../../features/posts/api/controllers';

export class BaseCrudApiServiceOnlyErrors<TCommand> {
  constructor(private readonly commandBus: CommandBus) {}
  async create(command: TCommand): Promise<void> {
    const notificationResult = await this.commandBus.execute<
      TCommand,
      LayerNoticeInterceptor
    >(command);

    if (notificationResult.hasError) {
      const { error } = handleErrors(
        notificationResult.code,
        notificationResult.extensions[0],
      );
      throw error;
    }
    return;
  }
}
