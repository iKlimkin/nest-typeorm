import { EntityManager } from 'typeorm';
import { OutputId } from '../../../../domain/output.models';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { QuizGame } from '../../domain/entities/quiz-game.entity';
import { QuizPlayerProgress } from '../../domain/entities/quiz-player-progress.entity';
import { UserAccount } from '../../../admin/domain/entities/user-account.entity';
import { v4 as uuidv4 } from 'uuid';
import { createUser } from './mockUserRepo';
import { GameStatus } from '../../api/models/input.models/statuses.model';

export class QuizRepoMockForCreate {
  async getPendingPair(
    manager: EntityManager,
  ): Promise<LayerNoticeInterceptor<QuizGame | null>> {
    return Promise.resolve(new LayerNoticeInterceptor(null));
  }

  async saveProgress(
    progressDto: QuizPlayerProgress,
    manager: EntityManager,
  ): Promise<QuizPlayerProgress> {
    return await saveProgress();
  }
  async saveGame(
    game: QuizGame,
    manager: EntityManager,
  ): Promise<LayerNoticeInterceptor<OutputId>> {
    return Promise.resolve(new LayerNoticeInterceptor({ id: '123' }));
  }
}

export class QuizRepoMockForConnect {
  async getPendingPair(
    manager: EntityManager,
  ): Promise<LayerNoticeInterceptor<QuizGame | null>> {
    const createdGame = createPair();

    return Promise.resolve(new LayerNoticeInterceptor(createdGame));
  }

  async saveProgress(
    progressDto: QuizPlayerProgress,
    manager: EntityManager,
  ): Promise<QuizPlayerProgress> {
    return saveProgress();
  }

  async saveConnection(
    quizConnection: QuizGame,
    manager: EntityManager,
  ): Promise<LayerNoticeInterceptor<QuizGame>> {
    const quizGame = createPair();
    const secondPlayerProgress = createProgress(
      createUser(),
    ) as QuizPlayerProgress;
    const createdGameConnection = createConnection(
      quizGame,
      secondPlayerProgress,
    );

    return Promise.resolve(new LayerNoticeInterceptor(createdGameConnection));
  }
}

const saveProgress = async () => {
  const user = createUser();
  const progress = createProgress(user) as QuizPlayerProgress;
  return Promise.resolve(progress);
};

const createProgress = (user: Partial<UserAccount>) => ({
  id: uuidv4(),
  login: user.login,
  player: user,
  answers: [],
  answersCount: 0,
  score: 0,
  created_at: new Date(),
});

const createGame = (playerProgress: QuizPlayerProgress) =>
  ({
    id: uuidv4(),
    status: GameStatus.PendingSecondPlayer,
    firstPlayerProgress: playerProgress,
    firstPlayerId: playerProgress.player.id,
    secondPlayerId: null,
    secondPlayerProgress: null,
    created_at: new Date(),
    startGameDate: null,
    version: 1,
    finishGameDate: null,
    questions: null,
  }) as QuizGame;

function createPair(): QuizGame {
  const user = createUser();
  const progress = createProgress(user) as QuizPlayerProgress;
  const createdGame = createGame(progress) as QuizGame;
  return createdGame;
}

const createConnection = (
  quizPair: QuizGame,
  secondPlayerProgress: QuizPlayerProgress,
) => {
  quizPair.secondPlayerId = secondPlayerProgress.id;
  quizPair.secondPlayerProgress = secondPlayerProgress;
  quizPair.status = GameStatus.Active;
  quizPair.startGameDate = new Date();

  return quizPair;
};
