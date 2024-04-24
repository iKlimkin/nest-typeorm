import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { OutputId } from '../../../../domain/output.models';
import { GetErrors } from '../../../../infra/utils/interlay-error-handler.ts/error-constants';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { validateOrRejectModel } from '../../../../infra/utils/validators/validate-or-reject.model';
import { UsersRepository } from '../../../admin/infrastructure/users.repo';
import { GameStatus } from '../../api/models/input.models/statuses.model';
import { QuizGame } from '../../domain/entities/quiz-game.entity';
import { QuizPlayerProgress } from '../../domain/entities/quiz-player-progress.entity';
import { QuizRepository } from '../../infrastructure/quiz-game.repo';
import { CreatePairCommand } from '../commands/create-pair.command';
import { DataSource } from 'typeorm';
import { runInTransaction } from '../../../../domain/transaction-wrapper';

@CommandHandler(CreatePairCommand)
export class CreatePairUseCase implements ICommandHandler<CreatePairCommand> {
  constructor(
    private readonly quizRepo: QuizRepository,
    private readonly usersRepo: UsersRepository,
    private readonly dataSource: DataSource
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

    try {
      return runInTransaction(this.dataSource, async (queryRunner) => {
        const user = await this.usersRepo.getUserById(userId);

        const firstPlayerProgressDto = QuizPlayerProgress.create(
          user.login,
          user
        );

        const quizGameDto = new QuizGame();
        quizGameDto.status = GameStatus.PendingSecondPlayer;

        const result = await this.quizRepo.saveGame(
          quizGameDto,
          firstPlayerProgressDto
        );

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
      });
    } catch (error) {
      notice.addError(
        'transaction error',
        'transaction',
        GetErrors.Transaction
      );
      return notice;
    }
  }
}
