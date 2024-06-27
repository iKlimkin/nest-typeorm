import { QuizPairViewType } from './quiz-game.view-type';

const convertPlayerProgress = (rawPlayerProgress: any) => {
  const { id, login, score } = rawPlayerProgress;
  let answers = [];

  if (rawPlayerProgress.answers !== null) {
    answers = convertAnswers(rawPlayerProgress.answers);
  }
  // const answers = rawPlayerProgress.answers || [];
  const player = { id, login };

  return id ? { answers, player, score } : null;
};

const convertAnswers = (answers: any[]) =>
  answers.map((a) => ({
    questionId: a.questionId,
    answerStatus: a.answerStatus,
    addedAt: new Date(a.addedAt).toISOString(),
  }));

const convertQuestions = (questions) =>
  questions.map(({ id, body }) => ({ id, body }));

export const transformRawQuizDataToView = (item: any): QuizPairViewType => {
  let {
    firstPlayerProgressRaw,
    secondPlayerProgressRaw,
    firstPlayerId,
    secondPlayerId,
    id,
    finishGameDate,
    startGameDate,
    created_at: pairCreatedDate,
    status,
    questions: rawQuestions,
  } = item;

  firstPlayerProgressRaw = { ...firstPlayerProgressRaw, id: firstPlayerId };

  secondPlayerProgressRaw = { ...secondPlayerProgressRaw, id: secondPlayerId };

  const [firstPlayerProgress, secondPlayerProgress] = [
    firstPlayerProgressRaw,
    secondPlayerProgressRaw,
  ].map(convertPlayerProgress);

  const questionTxt = rawQuestions[0].body;
  const questions = questionTxt ? convertQuestions(rawQuestions) : null;

  if (finishGameDate) {
    finishGameDate = finishGameDate.toISOString();
  } else {
    finishGameDate = null;
  }

  return {
    id,
    firstPlayerProgress,
    secondPlayerProgress,
    questions,
    status,
    pairCreatedDate: pairCreatedDate.toISOString(),
    startGameDate: startGameDate.toISOString(),
    finishGameDate,
  };
};
