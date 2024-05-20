import { RouterPaths } from '../helpers/routing';

export class QuizQuestionsRouting {
  constructor(private readonly baseUrl = RouterPaths.quizQuestions) {}
  getQuestions = () => this.baseUrl;
  createQuestion = () => this.baseUrl;
  updateQuestion = (id: string) => `${this.baseUrl}/${id}`;
  publishQuestion = (id: string) => `${this.baseUrl}/${id}/publish`;
  deleteQuestion = (id: string) => `${this.baseUrl}/${id}`;
}
