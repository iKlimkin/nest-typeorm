import { RouterPaths } from '../helpers/routing';

export class QuizPairsRouting {
  constructor(private readonly baseUrl = RouterPaths.quiz) {}
  getTopUsers = () => `${this.baseUrl}/users/top`;
  getUserGames = () => `${this.baseUrl}/pairs/my`;
  getUserStatistic = () => `${this.baseUrl}/users/my-statistic`;
  getCurrentUnfinishedGame = () => `${this.baseUrl}/pairs/my-current`;
  getGame = (id: string) => `${this.baseUrl}/pairs/${id}`;
  connectOrCreate = () => `${this.baseUrl}/pairs/connection`;
  sendAnswer = () => `${this.baseUrl}/pairs/my-current/answers`;
}
