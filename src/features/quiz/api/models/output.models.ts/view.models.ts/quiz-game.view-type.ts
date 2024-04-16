import { AnswerStatus, GameStatus } from '../../input.models/statuses.model';

type PlayerInfoType = {
  id: string;
  login: string;
};

type AnswersInfoType = {
  questionId: string;
  answerStatus: AnswerStatus;
  addedAt: string;
}[];

type PlayerProgressType = {
  answers: AnswersInfoType;
  player: PlayerInfoType;
  score: number;
};

export interface QuizPairViewType {
  id: string;
  firstPlayerProgress: PlayerProgressType;
  secondPlayerProgress?: PlayerProgressType;
  questions?: {
    id: string;
    body: string;
  }[];
  status: GameStatus;
  pairCreatedDate: string;
  startGameDate?: string;
  finishGameDate?: string;
}
