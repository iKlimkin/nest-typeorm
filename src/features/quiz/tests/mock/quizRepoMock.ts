import { EntityManager } from 'typeorm';
import { OutputId } from '../../../../domain/output.models';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { QuizGame } from '../../domain/entities/quiz-game.entity';
import { QuizPlayerProgress } from '../../domain/entities/quiz-player-progress.entity';
import { UserAccount } from '../../../admin/domain/entities/user-account.entity';
import { v4 as uuidv4 } from 'uuid';
import { GameStatus } from '../../api/models/input.models/statuses.model';
import { CurrentGameQuestion } from '../../domain/entities/current-game-questions.entity';
import { QuizCorrectAnswer } from '../../domain/entities/quiz-correct-answers.entity';
import { QuizAnswer } from '../../domain/entities/quiz-answer.entity';

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
    const user = createUser();
    const secondPlayerProgress = createProgress(user) as QuizPlayerProgress;
    const createdGameConnection = createConnection(
      quizGame,
      secondPlayerProgress,
      user.id,
    );

    return Promise.resolve(new LayerNoticeInterceptor(createdGameConnection));
  }
}

export class QuizRepoMockForSetAnswer {
  async getCurrentGameByUserId(
    userId: string,
    manager: EntityManager,
  ): Promise<QuizGame> {
    return startGame(userId);
  }

  async finishGame(
    gameId: string,
    winnerId: string | null,
    manager: EntityManager,
  ): Promise<void> {}

  async saveProgress(
    currentPlayerProgress: QuizPlayerProgress,
    manager: EntityManager,
  ): Promise<QuizPlayerProgress> {
    return currentPlayerProgress;
  }
  async saveGame(
    game: QuizGame,
    manager: EntityManager,
  ): Promise<LayerNoticeInterceptor<OutputId>> {
    return Promise.resolve(new LayerNoticeInterceptor({ id: '123' }));
  }
  async saveAnswer(
    answerDto: QuizAnswer,
    manager: EntityManager,
  ): Promise<QuizAnswer> {
    answerDto.id = uuidv4();
    answerDto.created_at = new Date();
    return answerDto;
  }

  async getCurrentGameQuestion(
    gameId: string,
    order: number,
  ): Promise<CurrentGameQuestion> {
    return createCurrentGameQuestion();
  }

  async getAnswersForCurrentQuestion(
    questionId: string,
    manager: EntityManager,
  ): Promise<QuizCorrectAnswer[] | null> {
    return getAnswers(questionId);
  }
}

function createCurrentGameQuestion(): CurrentGameQuestion {
  const gameQuestion = new CurrentGameQuestion();
  gameQuestion.questionId = '1';
  return gameQuestion;
}

function getAnswers(questionId: string): QuizCorrectAnswer[] {
  const correctAnswers = ['1', '2', '3'];
  return QuizCorrectAnswer.create(correctAnswers);
}

const saveProgress = () => {
  const user = createUser();
  const progress = createProgress(user);
  return Promise.resolve(progress);
};

const createProgress = (user: UserAccount, answerCount = 0, score = 0) => {
  const playerProgress = new QuizPlayerProgress();
  playerProgress.id = uuidv4();
  playerProgress.player = user;
  playerProgress.login = user.login;
  playerProgress.answers = [];
  playerProgress.answersCount = answerCount;
  playerProgress.score = score;
  playerProgress.created_at = new Date();

  return playerProgress;
};

type CreateUserType = {
  email?: string;
  login?: string;
  userId?: string;
};

export const createUser = (options?: CreateUserType): UserAccount =>
  ({
    id: options?.userId || '1',
    email: options?.email || 'email',
    login: options?.login || 'login0',
    password_hash: 'hash',
    is_confirmed: true,
    created_at: new Date(),
  }) as UserAccount;

const createGame = (playerProgress: QuizPlayerProgress) => {
  const game = new QuizGame();
  game.id = uuidv4();
  game.status = GameStatus.PendingSecondPlayer;
  game.firstPlayerProgress = playerProgress;
  game.firstPlayerId = playerProgress.player.id;
  game.secondPlayerId = null;
  game.secondPlayerProgress = null;
  game.created_at = new Date();
  game.startGameDate = null;
  game.version = 1;
  game.finishGameDate = null;
  game.questions = null;

  return game;
};

function createPair(answerCount?: number): QuizGame {
  const user = createUser();
  const firstPlayerProgress = createProgress(user, answerCount);
  const createdGame = createGame(firstPlayerProgress);
  return createdGame;
}

const createConnection = (
  quizPair: QuizGame,
  secondPlayerProgress: QuizPlayerProgress,
  userId: string,
) => {
  quizPair.secondPlayerId = userId;
  quizPair.secondPlayerProgress = secondPlayerProgress;
  quizPair.status = GameStatus.Active;
  quizPair.startGameDate = new Date();
  quizPair.version = 2;
  quizPair.questions = [];

  return quizPair;
};

const handleFinishGame = () => {};

type Options = {
  fPAnswerCount?: number;
  sPAnswerCount?: number;
  fPFinishedGame?: boolean;
  sPFinishedGame?: boolean;
  fPScore?: number;
  sPScore?: number;
};

class GameOptions {
  fPAnswerCount: number;
  sPAnswerCount: number;
  fPFinishedGame: boolean;
  sPFinishedGame: boolean;
  fPScore: number;
  sPScore: number;
  constructor({
    fPAnswerCount = 0,
    sPAnswerCount = 0,
    fPFinishedGame = false,
    sPFinishedGame = false,
    fPScore = 0,
    sPScore = 0,
  }: Options = {}) {
    this.fPAnswerCount = fPAnswerCount;
    this.sPAnswerCount = sPAnswerCount;
    this.fPFinishedGame = fPFinishedGame;
    this.sPFinishedGame = sPFinishedGame;
    this.fPScore = fPScore;
    this.sPScore = sPScore;
  }
}

export const startGame = (userId: string, options?: Options): QuizGame => {
  const {
    fPAnswerCount,
    fPFinishedGame,
    fPScore,
    sPAnswerCount,
    sPFinishedGame,
    sPScore,
  } = new GameOptions(options);

  const firstUser = createUser();
  const firstPlayerProgress = createProgress(firstUser, fPAnswerCount, fPScore);

  fPFinishedGame
    ? (firstPlayerProgress.questCompletionDate = new Date())
    : null;

  const createdGame = createGame(firstPlayerProgress);

  const secondUser = createUser({ email: 'email1', login: 'login1', userId });

  const secondPlayerProgress = createProgress(
    secondUser,
    sPAnswerCount,
    sPScore,
  );

  sPFinishedGame
    ? (secondPlayerProgress.questCompletionDate = new Date())
    : null;

  const activePair = createConnection(
    createdGame,
    secondPlayerProgress,
    secondUser.id,
  );

  return activePair;
};
