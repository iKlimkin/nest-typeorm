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
  constructor(
    private readonly quizRepo: QuizRepository,
    private readonly usersRepo: UsersRepository,
    private readonly dataSource: DataSource
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
    try {
      return runInTransaction(this.dataSource, async (queryRunner) => {
        const user = await this.usersRepo.getUserById(userId);
        const pairToConnect = await this.quizRepo.getPendingPair();

        if (!pairToConnect) {
          notice.addError(
            'No pending pairs',
            'ConnectPlayerUseCase',
            GetErrors.DatabaseFail
          );
          return notice;
        }

        const secondPlayerProgress = QuizPlayerProgress.create(
          user.login,
          user
        );

        const result = await this.quizRepo.connect(
          user,
          secondPlayerProgress,
          pairToConnect
        );

        const questions = await this.quizRepo.getFiveRandomQuestions();

        const currentGameQuestions = questions.map((q, i) => {
          const currentGameQuestion = new CurrentGameQuestion();
          currentGameQuestion.quizPair = result;
          currentGameQuestion.questionId = q.id;
          currentGameQuestion.order = i + 1;

          return currentGameQuestion;
        });

        await this.quizRepo.saveCurrentGameQuestions(currentGameQuestions);

        if (!result) {
          notice.addError(
            `the user hasn't connected to the pair`,
            'ConnectPlayerUseCase',
            GetErrors.DatabaseFail
          );
        } else {
          notice.addData({ id: result.id });
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
