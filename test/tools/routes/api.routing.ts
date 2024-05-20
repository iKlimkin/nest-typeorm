import { QuizPairsRouting } from './quizPairs.routing';
import { QuizQuestionsRouting } from './quizQuestions.routing';

export class ApiRouting {
  questions: QuizQuestionsRouting;
  pairs: QuizPairsRouting;

  constructor() {
    this.questions = new QuizQuestionsRouting();
    this.pairs = new QuizPairsRouting();
  }
}
