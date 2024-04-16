import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GetErrors } from '../../../../infra/utils/interlay-error-handler.ts/error-constants';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { validateOrRejectModel } from '../../../../infra/utils/validators/validate-or-reject.model';
import { QuizRepository } from '../../infrastructure/quiz-game.repo';

import { OutputId } from '../../../../domain/output.models';
import { UsersRepository } from '../../../admin/infrastructure/users.repo';
import { GameStatus } from '../../api/models/input.models/statuses.model';
import { QuizGame } from '../../domain/entities/quiz-game.entity';
import { ConnectPlayerCommand } from '../commands/connect-player.command';
import { PlayerProgress } from '../../domain/entities/quiz-player-progress.entity';

@CommandHandler(ConnectPlayerCommand)
export class ConnectPlayerUseCase implements ICommandHandler<ConnectPlayerCommand> {
  constructor(
    private readonly quizRepo: QuizRepository,
    private readonly usersRepo: UsersRepository
  ) {}

  async execute(
    command: ConnectPlayerCommand
  ): Promise<LayerNoticeInterceptor<OutputId | null>> {
    const notice = new LayerNoticeInterceptor<OutputId>();
    const { userId } = command.connectionData;

    try {
      await validateOrRejectModel(command, ConnectPlayerCommand);
    } catch (e) {
      notice.addError('incorrect model', 'validator', GetErrors.IncorrectModel);
      return notice;
    }

    const user = await this.usersRepo.getUserById(userId);

    const quizGame = new QuizGame();
    // quizGame.status = GameStatus.PendingSecondPlayer;
    // // quizGame.firstPlayer.playerId = userId,
    // // quizGame.firstPlayer.login = user.login

    const playerProgress = new PlayerProgress();
    // playerProgress.playerId = userId, 
    // playerProgress.login = user.login
    // playerProgress.game.id = quizGame.id
    // console.log({quizGame, playerProgress});
    
    const result = await this.quizRepo.saveGame(quizGame, playerProgress);

    if (!result) {
      notice.addError(
        'Quiz not created',
        'ConnectPlayerUseCase',
        GetErrors.DatabaseFail
      );
    } else {
      notice.addData(result);
    }

    return notice;
  }
}
