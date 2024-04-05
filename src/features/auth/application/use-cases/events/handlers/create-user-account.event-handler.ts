import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { CreateUserAccountEvent } from '../create-user-account-event';
import { CreateUserCommand } from '../../commands/create-user.command';
import { validateOrRejectModel } from '../../../../../../infra/utils/validators/validate-or-reject.model';

@EventsHandler(CreateUserAccountEvent)
export class CreateUserAccountEventHandler
  implements IEventHandler<CreateUserAccountEvent>
{
  constructor(private commandBus: CommandBus) {}
  async handle(event: CreateUserAccountEvent) {
    try {
      await validateOrRejectModel(event, CreateUserAccountEvent);

      const command = new CreateUserCommand(event.userDto);
      await this.commandBus.execute(command);
    } catch (error) {
      console.log(error);
      return null;
    }
  }
}
