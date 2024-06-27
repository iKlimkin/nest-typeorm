import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { OutputId } from '../../../../domain/output.models';
import { runInTransaction } from '../../../../domain/transaction-wrapper';
import { GetErrors } from '../../../../infra/utils/interlay-error-handler.ts/error-constants';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { validateOrRejectModel } from '../../../../infra/utils/validators/validate-or-reject.model';
import { UsersRepository } from '../../../admin/infrastructure/users.repo';
import { CurrentGameQuestion } from '../../domain/entities/current-game-questions.entity';
import { QuizPlayerProgress } from '../../domain/entities/quiz-player-progress.entity';
import { QuizRepository } from '../../infrastructure/quiz-game.repo';
import { ConnectPlayerCommand } from '../commands/connect-player.command';

@CommandHandler(ConnectPlayerCommand)
export class ConnectPlayerUseCase
  implements ICommandHandler<ConnectPlayerCommand>
{
  private readonly location = 'ConnectPlayerUserCase';
  constructor(
    private readonly quizRepo: QuizRepository,
    private readonly usersRepo: UsersRepository,
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    command: ConnectPlayerCommand,
  ): Promise<LayerNoticeInterceptor<OutputId | null>> {
    const notice = new LayerNoticeInterceptor<OutputId>();
    const { quizRepo, location } = this;
    const { userId } = command.connectionData;

    try {
      await validateOrRejectModel(command, ConnectPlayerCommand);
    } catch (e) {
      notice.addError('incorrect model', location, GetErrors.IncorrectModel);
      return notice;
    }
    try {
      return runInTransaction(this.dataSource, async (manager) => {
        const user = await this.usersRepo.getUserById(userId);
        const pairToConnect = await quizRepo.getPendingPair(manager);

        if (pairToConnect.hasError || !user) {
          notice.addError(
            !pairToConnect.data
              ? pairToConnect.errorMessage || 'No pending pairs'
              : 'User not found',
            location,
            GetErrors.NotFound,
          );
          return notice;
        }

        const secondPlayerProgress = QuizPlayerProgress.create(user);

        const savedProgress = await quizRepo.saveProgress(
          secondPlayerProgress,
          manager,
        );

        const createdConnectionToQuiz = pairToConnect.data.createConnection({
          secondPlayerProgress: savedProgress,
          playerId: userId,
        });

        const result = await quizRepo.saveConnection(
          createdConnectionToQuiz,
          manager,
        );

        if (!result.data) {
          notice.addError(
            result.errorMessage || `player hasn't connected`,
            location,
            GetErrors.DatabaseFail,
          );
          return notice;
        }

        const questions = await quizRepo.getFiveRandomQuestions(manager);

        if (questions.data.length !== 5) {
          notice.addError(
            questions.errorMessage || 'No questions in db',
            location,
            GetErrors.DatabaseFail,
          );
          return notice;
        }

        const currentGameQuestions = CurrentGameQuestion.createQuestionsBatch(
          result.data,
          questions.data,
        );

        await quizRepo.saveCurrentGameQuestions(currentGameQuestions, manager);

        notice.addData({ id: result.data.id });
        return notice;
      });
    } catch (error) {
      notice.addError('transaction error', location, GetErrors.Transaction);
      return notice;
    }
  }
}
