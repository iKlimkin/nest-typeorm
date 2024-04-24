import { QuizAnswer } from '../../../../domain/entities/quiz-answer.entity';
import { QuizGame } from '../../../../domain/entities/quiz-game.entity';
import { QuizPairViewType } from './quiz-game.view-type';

export const getQuizPairViewModel = (
  quizPair: QuizGame,
  quizAnswers?: QuizAnswer[]
): QuizPairViewType => ({
  id: quizPair.id,
  firstPlayerProgress: {
    answers: quizAnswers
      ? quizAnswers.map((answer) => {
          if (answer.playerProgress.id === quizPair.firstPlayerId)
            return {
              questionId: answer.questionId,
              answerStatus: answer.answerStatus,
              addedAt: answer.created_at.toISOString(),
            };
        })
      : [],
    player: {
      id: quizPair.firstPlayerId,
      login: quizPair.firstPlayerProgress?.login,
    },
    score: quizPair.firstPlayerProgress?.score || 0,
  },
  secondPlayerProgress: quizPair.secondPlayerProgress
    ? {
        answers: quizAnswers
          ? quizAnswers.map((answer) => {
              if (answer.playerProgress.id === quizPair.secondPlayerId)
                return {
                  questionId: answer.questionId,
                  answerStatus: answer.answerStatus,
                  addedAt: answer.created_at.toISOString(),
                };
            })
          : [],
        player: quizPair.secondPlayerProgress
          ? {
              id: quizPair.secondPlayerId,
              login: quizPair.secondPlayerProgress?.login,
            }
          : null,
        score: quizPair.secondPlayerProgress?.score || 0,
      }
    : null,
  status: quizPair.status,
  questions: quizPair.questions
    ? quizPair.questions.map((q) => ({
        id: q.questionId,
        body: q.question.id === q.questionId ? q.question.body : null,
      }))
    : null,
  pairCreatedDate: quizPair.created_at.toISOString(),
  startGameDate: quizPair.startGameDate?.toISOString(),
  finishGameDate: quizPair.finishGameDate?.toISOString(),
});

export const getQuizPairPendingViewModel = (
  quizPair: QuizGame
): QuizPairViewType => ({
  id: quizPair.id,
  firstPlayerProgress: quizPair.firstPlayerProgress
    ? {
        answers: null,
        player: {
          id: quizPair.firstPlayerId,
          login: quizPair.firstPlayerProgress.login,
        },
        score: quizPair.firstPlayerProgress.score,
      }
    : null,
  secondPlayerProgress: null,
  status: quizPair.status,
  questions: null,
  pairCreatedDate: quizPair.created_at.toISOString(),
  startGameDate: null,
  finishGameDate: null,
});
