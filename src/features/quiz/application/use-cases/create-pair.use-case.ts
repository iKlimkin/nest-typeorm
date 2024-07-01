import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { OutputId } from '../../../../domain/output.models';
import { runInTransaction } from '../../../../domain/transaction-wrapper';
import { GetErrors } from '../../../../infra/utils/interlay-error-handler.ts/error-constants';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { validateOrRejectModel } from '../../../../infra/utils/validators/validate-or-reject.model';
import { UsersRepository } from '../../../admin/infrastructure/users.repo';
import { QuizGame } from '../../domain/entities/quiz-game.entity';
import { QuizPlayerProgress } from '../../domain/entities/quiz-player-progress.entity';
import { QuizRepository } from '../../infrastructure/quiz-game.repo';
import { CreatePairCommand } from '../commands/create-pair.command';

@CommandHandler(CreatePairCommand)
export class CreatePairUseCase implements ICommandHandler<CreatePairCommand> {
  private readonly location = 'CreatePairUseCase';
  constructor(
    private readonly quizRepo: QuizRepository,
    private readonly usersRepo: UsersRepository,
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    command: CreatePairCommand,
  ): Promise<LayerNoticeInterceptor<OutputId>> {
    const notice = new LayerNoticeInterceptor<OutputId>();
    const { location, quizRepo, usersRepo } = this;
    const { userId } = command.data;

    try {
      await validateOrRejectModel(command, CreatePairCommand);
    } catch (e) {
      notice.addError('incorrect model', location, GetErrors.IncorrectModel);
      return notice;
    }

    try {
      return runInTransaction(this.dataSource, async (manager) => {
        const pendingPair = await quizRepo.getPendingPair(manager);
        const user = await usersRepo.getUserById(userId);

        if (pendingPair.data || !user) {
          notice.addError(
            pendingPair.data
              ? pendingPair.errorMessage || 'there is already a pending pair'
              : 'user not found',
            location,
            pendingPair.data ? GetErrors.Forbidden : GetErrors.NotFound,
          );
          return notice;
        }

        const firstPlayerProgressDto = QuizPlayerProgress.create(user);

        const firstPlayerProgress = await quizRepo.saveProgress(
          firstPlayerProgressDto,
          manager,
        );
        const quizDto = QuizGame.createGame(firstPlayerProgress);

        const result = await quizRepo.saveGame(quizDto, manager);

        if (!result.data) {
          notice.addError(
            'error occurred during save game',
            location,
            GetErrors.DatabaseFail,
          );
        } else {
          notice.addData(result.data);
        }

        return notice;
      });
    } catch (error) {
      notice.addError(
        `transaction error: ${error}`,
        location,
        GetErrors.Transaction,
      );
      return notice;
    }
  }
}
