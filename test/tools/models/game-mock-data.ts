import { QuizPairViewType } from '../../../src/features/quiz/api/models/output.models.ts/view.models.ts/quiz-game.view-type';

export const mockGameData: QuizPairViewType = {
  id: expect.any(String),
  firstPlayerProgress: {
    answers: expect.any(Array),
    player: {
      id: expect.any(String),
      login: expect.any(String),
    },
    score: expect.any(Number),
  },
  secondPlayerProgress: {
    answers: expect.any(Array),
    player: {
      id: expect.any(String),
      login: expect.any(String),
    },
    score: expect.any(Number),
  },
  status: expect.any(String),
  questions: expect.any(Array),
  pairCreatedDate: expect.any(String),
  startGameDate: expect.any(String),
  finishGameDate: expect.any(String),
};
