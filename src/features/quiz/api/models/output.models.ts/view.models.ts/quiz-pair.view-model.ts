import {
  QuizGame,
} from '../../../../domain/entities/quiz-game.entity';
import { QuizPairViewType } from './quiz-game.view-type';

export const getQuizPairViewModel = (quizPair: QuizGame): QuizPairViewType => ({
  id: quizPair.id,
  firstPlayerProgress: {
    answers: [],
    player: {
      id: quizPair.firstPlayer?.id,
      login: quizPair.firstPlayer?.login,
    },
    score: quizPair.firstPlayer?.gameProgress?.score || 0,
  },
  secondPlayerProgress: {
    answers: [],
    player: {
      id: quizPair.secondPlayer?.id,
      login: quizPair.secondPlayer?.login,
    },
    score: quizPair.secondPlayer?.gameProgress?.score || 0,
  },
  status: quizPair.status,
  questions: quizPair.questions,
  pairCreatedDate: quizPair.created_at.toISOString(),
  startGameDate: quizPair.startGameDate?.toISOString(),
  finishGameDate: quizPair.finishGameDate?.toISOString(),
});
