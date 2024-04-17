import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GetErrors } from '../../../../infra/utils/interlay-error-handler.ts/error-constants';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { validateOrRejectModel } from '../../../../infra/utils/validators/validate-or-reject.model';
import { QuizAnswer } from '../../domain/entities/quiz-answer.entity';
import { QuizQuestion } from '../../domain/entities/quiz-question.entity';
import { QuizRepository } from '../../infrastructure/quiz-game.repo';
import { CreatePairCommand } from '../commands/create-pair.command';
import { OutputId } from '../../../../domain/output.models';
import { QuizGame } from '../../domain/entities/quiz-game.entity';
import { PlayerProgress } from '../../domain/entities/quiz-player-progress.entity';
import { GameStatus } from '../../api/models/input.models/statuses.model';
import { UsersRepository } from '../../../admin/infrastructure/users.repo';
import { log } from 'console';

@CommandHandler(CreatePairCommand)
export class CreatePairUseCase implements ICommandHandler<CreatePairCommand> {
  constructor(
    private readonly quizRepo: QuizRepository,
    private readonly usersRepo: UsersRepository
  ) {}

  async execute(
    command: CreatePairCommand
  ): Promise<LayerNoticeInterceptor<OutputId | null>> {
    const notice = new LayerNoticeInterceptor<OutputId>();
    const { userId } = command.createData;

    try {
      await validateOrRejectModel(command, CreatePairCommand);
    } catch (e) {
      notice.addError('incorrect model', 'validator', GetErrors.IncorrectModel);
      return notice;
    }

    const user = await this.usersRepo.getUserById(userId);

    const firstPlayerProgressDto = PlayerProgress.create(user.login, user.id);
    firstPlayerProgressDto.player = user

    const quizGameDto = new QuizGame();
    quizGameDto.status = GameStatus.PendingSecondPlayer;
    quizGameDto.firstPlayer = user;

    const result = await this.quizRepo.saveGame(quizGameDto, firstPlayerProgressDto);

    if (!result) {
      notice.addError(
        'Quiz not created',
        'CreatePairUseCase',
        GetErrors.DatabaseFail
      );
    } else {
      notice.addData(result);
    }

    return notice;
  }
}
