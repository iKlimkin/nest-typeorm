export interface GameStatsData {
  winsCount: number;
  lossesCount: number;
  drawsCount: number;
  gamesCount: number;
  sumScore: number;
  avgScore: number;
}

export class GameStats {
  constructor(
    public winsCount: number,
    public lossesCount: number,
    public drawsCount: number,
    public gamesCount: number,
    public sumScore: number | string,
    public avgScores: any,
  ) {
    this.sumScore = +sumScore || 0;
    this.avgScores = +parseFloat(avgScores).toFixed(2) || 0;
  }
}

export interface PlayerStatsView extends GameStats {
  player: {
    id: string;
    login: string;
  }
}

export interface IUserStats {
  id: string;
  login: string;
  winsCount: string;
  lossesCount: string;
  drawsCount: string;
  gamesCount: string;
  sumScore: string;
  avgScores: string;
}

export class UserStats {
  id: string;
  login: string;
  winsCount: number;
  lossesCount: number;
  drawsCount: number;
  gamesCount: number;
  sumScore: number;
  avgScores: number;

  constructor(stats: IUserStats) {
    this.id = stats.id;
    this.login = stats.login;
    this.winsCount = parseInt(stats.winsCount, 10);
    this.lossesCount = parseInt(stats.lossesCount, 10);
    this.drawsCount = parseInt(stats.drawsCount, 10);
    this.gamesCount = parseInt(stats.gamesCount, 10);
    this.sumScore = parseInt(stats.sumScore, 10);
    this.avgScores = +parseFloat(stats.avgScores).toFixed(2);
  }
}
