import { Injectable } from '@nestjs/common';
import { CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { DataSource, EntityManager } from 'typeorm';
import {
  CurrentGameQuestion,
  QuizAnswer,
  QuizPlayerProgress,
  QuizRepository,
} from '../../../../settings';
import { runInTransaction } from '../../../../domain/transaction-wrapper';
import { GetErrors } from '../../../../infra/utils/interlay-error-handler.ts/error-constants';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';

@Injectable()
export class QuizScheduleService {
  private readonly lastPoint = 5;
  private readonly location = 'QuizService';
  constructor(
    private readonly quizRepo: QuizRepository,
    private readonly dataSource: DataSource,
    private readonly scheduleRegistry: SchedulerRegistry,
  ) {}

  async handleCompletionQuiz(gameId: string) {
    const { quizRepo, dataSource, location } = this;
    const notice = new LayerNoticeInterceptor();
    try {
      runInTransaction(dataSource, async (manager) => {
        const {
          finishGameDate,
          secondPlayerProgress,
          firstPlayerProgress,
          questions,
        } = await quizRepo.getGameById(gameId, manager);

        if (finishGameDate) {
          notice.addError('game is completed', location, GetErrors.Forbidden);
          return notice;
        }

        let targetProgress: QuizPlayerProgress;
        let finishedProgress: QuizPlayerProgress;

        if (firstPlayerProgress.questCompletionDate) {
          targetProgress = secondPlayerProgress;
          finishedProgress = firstPlayerProgress;
        } else {
          targetProgress = firstPlayerProgress;
          finishedProgress = secondPlayerProgress;
        }

        const completionDate = finishedProgress.questCompletionDate;
        const now = new Date().getTime();
        const tenSecondsLater = completionDate.getTime() + 10000;

        if (tenSecondsLater <= now) {
          targetProgress.setCompletionDate();

          await this.autocompleteAnswers(questions, targetProgress, manager);

          await this.handleBonuses(finishedProgress, manager);

          const winnerId = targetProgress.determineWinner(finishedProgress);

          await quizRepo.finishGame(gameId, winnerId, manager);
          this.deleteCompletionCheckJob(gameId);

          return notice;
        } else return notice;
      });
    } catch (error) {
      console.log({ error });
      notice.addError('transaction error', location, GetErrors.Transaction);
      return notice;
    }
  }

  private async autocompleteAnswers(
    questions: CurrentGameQuestion[],
    targetProgress: QuizPlayerProgress,
    manager: EntityManager,
  ) {
    try {
      const answersCount = targetProgress.answersCount;
      const answersDiff = this.lastPoint - answersCount;

      for (let i = 0; i < answersDiff; i++) {
        const answerData = {
          answerText: null,
          isCorrect: false,
          questionId: questions[answersCount + i].questionId,
          playerProgress: targetProgress,
        };

        const autocompletedAnswer = QuizAnswer.create(answerData);

        const timeDelta = new Date(Date.now() + i * 100);
        autocompletedAnswer.created_at = timeDelta;

        const savedAnswer = await this.quizRepo.saveAnswer(
          autocompletedAnswer,
          manager,
        );
        targetProgress.answers.push(savedAnswer);
        targetProgress.answersCount++;
      }
    } catch (error) {
      console.log({ error });
      throw new Error('Autocomplete answers error');
    }
  }

  private async handleBonuses(
    finishedProgress: QuizPlayerProgress,
    manager: EntityManager,
  ) {
    const currentPlayerFinishedEarlier = true;
    if (finishedProgress.isPlayerDeservesBonus(currentPlayerFinishedEarlier)) {
      finishedProgress.incrementScore();
      try {
        await this.quizRepo.saveProgress(finishedProgress, manager);
      } catch ({ message }) {
        console.log({ message });
        throw new Error('Handle bonuses error');
      }
    }
  }

  async createCompletionCheckJob(gameId: string) {
    const { job, jobKey } = this.getJob(gameId);

    if (!job) {
      const job = new CronJob(CronExpression.EVERY_SECOND, async () => {
        await this.handleCompletionQuiz(gameId);
      });

      this.scheduleRegistry.addCronJob(jobKey, job);
      job.start();
    } else {
      this.deleteCompletionCheckJob(gameId);
    }
  }
  deleteCompletionCheckJob(gameId: string) {
    const { job, jobKey } = this.getJob(gameId);
    if (job) {
      job.stop();
      this.scheduleRegistry.deleteCronJob(jobKey);
    }
  }

  private getJob(gameId: string) {
    const jobKey = `completionCheck-${gameId}`;
    try {
      const job = this.scheduleRegistry.getCronJob(jobKey);
      return { job, jobKey };
    } catch (error) {
      return { jobKey, job: null };
    }
  }
}
