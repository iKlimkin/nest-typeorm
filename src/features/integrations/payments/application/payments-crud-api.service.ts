import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { OutputSessionUrlType } from '../api/models/output/stripe-payments.output.types';
import { JoinTheMembershipPlanCommand } from '../../../blogs/application/use-case/commands/join-the-membership-plan.command';
import { PaymentsBaseCrudApiService } from '../../../../domain/base-services/base.payments.crud.api.service';

@Injectable()
export class PaymentsCrudApiService extends PaymentsBaseCrudApiService<
  JoinTheMembershipPlanCommand,
  OutputSessionUrlType
> {
  constructor(commandBus: CommandBus) {
    super(commandBus);
  }
}
