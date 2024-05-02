import { CurrentGameQuestion } from '../../../../domain/entities/current-game-questions.entity';
import { QuizAnswer } from '../../../../domain/entities/quiz-answer.entity';
import { QuizGame } from '../../../../domain/entities/quiz-game.entity';
import { QuizPairViewType } from './quiz-game.view-type';

const mapAnswer = (answer: QuizAnswer) => ({
  questionId: answer.questionId,
  answerStatus: answer.answerStatus,
  addedAt: answer.created_at.toISOString(),
});

const sortQuestionsByNumberInBody = (a, b) => {
  const getQuestionNumber = (str) => parseInt(str.match(/\d+/)[0]);
  const numA = getQuestionNumber(a.body);
  const numB = getQuestionNumber(b.body);
  return numA - numB;
};

const mapQuestions = (question: CurrentGameQuestion) => ({
  id: question.questionId,
  body: question.question.body,
});

const mapPlayer = (id: string, login: string) => ({
  id,
  login,
});

export const getQuizPairViewModel = (quizPair: QuizGame): QuizPairViewType => {
  const { firstPlayerProgress, secondPlayerProgress } = quizPair;
  const firstPlayerAnswers = firstPlayerProgress?.answers.length
    ? firstPlayerProgress.answers
    : null;
  const secondPlayerAnswers = secondPlayerProgress?.answers.length
    ? secondPlayerProgress.answers
    : null;
  const questions = quizPair?.questions.length ? quizPair.questions : null;

  return {
    id: quizPair.id,
    firstPlayerProgress: {
      answers: firstPlayerAnswers ? firstPlayerAnswers.map(mapAnswer) : null,
      player: mapPlayer(quizPair.firstPlayerId, firstPlayerProgress.login),
      score: firstPlayerProgress?.score || 0,
    },
    secondPlayerProgress: secondPlayerProgress
      ? {
          answers: secondPlayerAnswers
            ? secondPlayerAnswers.map(mapAnswer)
            : null,
          player: secondPlayerProgress
            ? mapPlayer(quizPair.secondPlayerId, secondPlayerProgress.login)
            : null,
          score: secondPlayerProgress?.score || 0,
        }
      : null,
    status: quizPair.status,
    questions: questions
      ? questions
        .map(mapQuestions)
        // .sort(sortQuestionsByNumberInBody)
      : null,
    pairCreatedDate: quizPair.created_at.toISOString(),
    startGameDate: quizPair.startGameDate?.toISOString() || null,
    finishGameDate: quizPair.finishGameDate?.toISOString() || null,
  };
};

export const getQuizPendingPairsViewModel = (
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
