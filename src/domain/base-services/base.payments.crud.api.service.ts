import { CommandBus } from '@nestjs/cqrs';
import { LayerNoticeInterceptor } from '../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { handleErrors } from '../../infra/utils/interlay-error-handler.ts/interlay-errors.handler';

export class PaymentsBaseCrudApiService<TCommand, OutputData> {
  constructor(private readonly commandBus: CommandBus) {}
  async create(command: TCommand): Promise<OutputData> {
    const notificationResult = await this.commandBus.execute<
      TCommand,
      LayerNoticeInterceptor<OutputData>
    >(command);

    if (notificationResult.hasError) {
      const { error } = handleErrors(
        notificationResult.code,
        notificationResult.extensions[0],
      );
      throw error;
    }

    return notificationResult.data;
  }
}
