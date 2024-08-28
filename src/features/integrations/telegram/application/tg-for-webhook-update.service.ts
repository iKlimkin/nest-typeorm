import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { HandleTelegramUpdatesCommand } from './use-cases/telegram-updates-handle.use-case';
import { BaseCrudApiServiceOnlyErrors } from '../../../../domain/base-services/base-crud-api-errors.service';

@Injectable()
export class TelegramCrudApiService extends BaseCrudApiServiceOnlyErrors<HandleTelegramUpdatesCommand> {
  constructor(commandBus: CommandBus) {
    super(commandBus);
  }
}
