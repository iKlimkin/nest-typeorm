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
    public avgScore: any,
  ) {
    this.sumScore = +sumScore || 0;
    this.avgScore = +parseFloat(avgScore).toFixed(2) || 0;
  }
}
