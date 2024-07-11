import { CommandBus } from '@nestjs/cqrs';
import { BaseEntity } from '../../../../domain/base-entity';
import {
  QuizQueryRepository,
  QuizQueryRepo,
} from '../../api/models/query-repositories/quiz.query.repo';
import {
  LayerNoticeInterceptor,
  handleErrors,
} from '../../../auth/api/controllers';
import { QuizPairViewType } from '../../api/models/output.models.ts/view.models.ts/quiz-game.view-type';
import { ConnectPlayerCommand } from '../commands/connect-player.command';
import { Injectable } from '@nestjs/common';

export interface BaseViewModel {
  id: string;
}

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
