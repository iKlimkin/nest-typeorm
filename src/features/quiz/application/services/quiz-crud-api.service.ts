import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { handleErrors } from '../../../../infra/utils/interlay-error-handler.ts/interlay-errors.handler';
import { BaseViewModel } from '../../../../domain/base-services/base.crud.api.service';
import { QuizPairViewType } from '../../api/models/output.models.ts/view.models.ts/quiz-game.view-type';
import {
  QuizQueryRepo,
  QuizQueryRepository,
} from '../../api/models/query-repositories/quiz.query.repo';
import { ConnectPlayerCommand } from '../commands/connect-player.command';

export class QuizCrudApiService<TCommand, TViewModel extends BaseViewModel> {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryRepo: QuizQueryRepository<TViewModel>,
  ) {}
  async joinOrCreatePair(command: TCommand): Promise<TViewModel> {
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

    return this.queryRepo.getPairInformation(notification.data.id);
  }
}

@Injectable()
export class QuizService extends QuizCrudApiService<
  ConnectPlayerCommand,
  QuizPairViewType
> {
  constructor(commandBus: CommandBus, queryRepo: QuizQueryRepo) {
    super(commandBus, queryRepo);
  }
}
