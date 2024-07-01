import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { OutputId } from '../../../domain/output.models';
import { LayerNoticeInterceptor } from '../../auth/api/controllers';
import { GameStatus } from '../api/models/input.models/statuses.model';
import { UpdateQuestionData } from '../api/models/input.models/update-question.model';
import { QuestionId } from '../api/models/output.models.ts/output.types';
import { CurrentGameQuestion } from '../domain/entities/current-game-questions.entity';
import { QuizAnswer } from '../domain/entities/quiz-answer.entity';
import { QuizCorrectAnswer } from '../domain/entities/quiz-correct-answers.entity';
import { QuizGame } from '../domain/entities/quiz-game.entity';
import { QuizPlayerProgress } from '../domain/entities/quiz-player-progress.entity';
import { QuizQuestion } from '../domain/entities/quiz-questions.entity';

@Injectable()
export class QuizRepository {
  constructor(
    @InjectRepository(QuizGame)
    private readonly quizPairs: Repository<QuizGame>,
    @InjectRepository(QuizQuestion)
    private readonly quizQuestions: Repository<QuizQuestion>,
    @InjectRepository(QuizAnswer)
    private readonly quizAnswers: Repository<QuizAnswer>,
    @InjectRepository(QuizPlayerProgress)
    private readonly playerProgress: Repository<QuizPlayerProgress>,
    @InjectRepository(QuizCorrectAnswer)
    private readonly quizCorrectAnswers: Repository<QuizCorrectAnswer>,
    @InjectRepository(CurrentGameQuestion)
    private readonly currentGameQuestions: Repository<CurrentGameQuestion>,
  ) {}

  async saveQuestionAndAnswers(
    quizQuestion: QuizQuestion,
    quizAnswers: QuizCorrectAnswer[],
  ): Promise<QuestionId | null> {
    try {
      const savedQuestion = await this.quizQuestions.save(quizQuestion);

      await Promise.all(
        quizAnswers.map(async (answer) => {
          answer.question = savedQuestion;
          return this.quizCorrectAnswers.save(answer);
        }),
      );

      return {
        questionId: savedQuestion.id,
      };
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async saveGame(
    quizGameDto: QuizGame,
    manager: EntityManager,
  ): Promise<LayerNoticeInterceptor<OutputId> | null> {
    try {
      const savedQuizGame = await manager.save(QuizGame, quizGameDto);

      return new LayerNoticeInterceptor({
        id: savedQuizGame.id,
      });
    } catch (error) {
      throw new Error(`saveGame finished with errors: ${error}`);
    }
  }

  async saveProgress(
    currentPlayerProgress: QuizPlayerProgress,
    manager: EntityManager,
  ): Promise<QuizPlayerProgress> {
    try {
      return manager.save(QuizPlayerProgress, currentPlayerProgress);
    } catch (error) {
      throw new Error(`saveProgress finished with errors: ${error}`);
    }
  }

  async saveAnswer(
    answerDto: QuizAnswer,
    manager: EntityManager,
  ): Promise<QuizAnswer> {
    try {
      return manager.save(answerDto);
    } catch (error) {
      console.log(`saveAnswer finished with errors: ${error}`);
      throw new Error();
    }
  }

  async finishGame(
    gameId: string,
    winnerId: string | null,
    manager: EntityManager,
  ): Promise<void> {
    try {
      await manager.update(QuizGame, gameId, {
        finishGameDate: new Date(),
        status: GameStatus.Finished,
        winnerId,
      });
    } catch (error) {
      console.log(`finishGame operation was interrupted with errors: ${error}`);
      throw new Error();
    }
  }

  async saveConnection(
    quizConnection: QuizGame,
    manager: EntityManager,
  ): Promise<LayerNoticeInterceptor<QuizGame | null>> {
    try {
      const connectedPair = await manager.save(QuizGame, quizConnection);

      return new LayerNoticeInterceptor(connectedPair);
    } catch (error) {
      return new LayerNoticeInterceptor(
        null,
        `${error} occurred during save connection`,
      );
    }
  }

  async updateQuestionAndAnswers(
    updateDto: UpdateQuestionData & { questionId: string },
  ): Promise<boolean> {
    try {
      const { body, correctAnswers, questionId } = updateDto;

      const formerAnswers = await this.quizCorrectAnswers.findBy({
        question: { id: questionId },
      });

      for (let i = 0; i < correctAnswers.length; i++) {
        const answerText = correctAnswers[i];
        const formerAnswer = formerAnswers[i];

        if (formerAnswer) {
          await this.quizCorrectAnswers.update(formerAnswer.id, { answerText });
        } else {
          const quizAnswer = this.quizCorrectAnswers.create({
            question: {
              id: questionId,
            },
            answerText,
          });
          await this.quizAnswers.save(quizAnswer);
        }
      }

      const result = await this.quizQuestions.update(
        {
          id: questionId,
        },
        { body, updated_at: new Date() },
      );

      return result.affected !== 0;
    } catch (error) {
      console.log(`updateQuestionAndAnswers: ${error}`);
      return false;
    }
  }

  async deleteQuestion(questionId: string): Promise<boolean> {
    try {
      const deleteQuestion = await this.quizQuestions.delete(questionId);

      return deleteQuestion.affected !== 0;
    } catch (error) {
      console.error(
        `Database fails during delete quiz-question operation ${error}`,
      );
      return false;
    }
  }

  async publishQuestion(questionId: string): Promise<boolean> {
    try {
      const result = await this.quizQuestions.update(questionId, {
        published: true,
        updated_at: new Date(),
      });

      return result.affected !== 0;
    } catch (error) {
      console.error(
        `Database fails during publish question operation ${error}`,
      );
      return false;
    }
  }

  async getPlayerProgressById(playerId: string): Promise<QuizPlayerProgress> {
    try {
      return this.playerProgress.findOne({
        where: { id: playerId },
        relations: ['answers'],
      });
    } catch (error) {
      throw new InternalServerErrorException(`getPlayerById: ${error}`);
    }
  }

  async getPendingPair(
    manager: EntityManager,
  ): Promise<LayerNoticeInterceptor<QuizGame | null>> {
    try {
      const pendingPair = await manager.findOne(QuizGame, {
        where: {
          status: GameStatus.PendingSecondPlayer,
          version: 1,
        },
      });

      return new LayerNoticeInterceptor(pendingPair);
    } catch (error) {
      return new LayerNoticeInterceptor(
        null,
        `${error} occurred during find pending pairs`,
      );
    }
  }

  async getCurrentGameQuestion(
    gameId: string,
    order: number,
    manager: EntityManager,
  ): Promise<CurrentGameQuestion> {
    try {
      return await manager.findOne(CurrentGameQuestion, {
        where: {
          quizPair: { id: gameId },
          order,
        },
      });
    } catch (error) {
      throw new Error(`getNextQuestion: ${error}`);
    }
  }

  async getFiveRandomQuestions(
    manager: EntityManager,
  ): Promise<LayerNoticeInterceptor<QuizQuestion[] | null>> {
    try {
      const questions = await manager
        .createQueryBuilder(QuizQuestion, 'q')
        .select()
        .where('q.published = :published', {
          published: true,
        })
        .orderBy('RANDOM()')
        .limit(5)
        .getMany();

      return new LayerNoticeInterceptor(questions);
    } catch (error) {
      return new LayerNoticeInterceptor(
        null,
        `${error} occurred while searching the database for five random questions`,
      );
    }
  }

  async saveCurrentGameQuestions(
    gameQuestions: CurrentGameQuestion[],
    manager: EntityManager,
  ): Promise<void> {
    try {
      await manager.save(CurrentGameQuestion, gameQuestions);
    } catch (error) {
      throw new Error(`${error} occurred while save questions`);
    }
  }

  async getAnswersForCurrentQuestion(
    questionId: string,
    manager: EntityManager,
  ): Promise<QuizCorrectAnswer[] | null> {
    try {
      const answers = await manager.find(QuizCorrectAnswer, {
        where: {
          question: { id: questionId },
        },
      });

      if (!answers.length) return null;

      return answers;
    } catch (error) {
      console.error(`checkAnswer: ${error}`);
      return null;
    }
  }
  async getCurrentGameByUserId(
    userId: string,
    manager: EntityManager,
  ): Promise<QuizGame> {
    try {
      return manager
        .createQueryBuilder(QuizGame, 'game')
        .leftJoinAndSelect('game.firstPlayerProgress', 'firstPlayerProgress')
        .leftJoinAndSelect('game.secondPlayerProgress', 'secondPlayerProgress')
        .leftJoin('firstPlayerProgress.player', 'firstPlayer')
        .leftJoin('secondPlayerProgress.player', 'secondPlayer')
        .addSelect(['firstPlayer.id', 'secondPlayer.id'])
        .leftJoinAndSelect('game.questions', 'questions')
        .where('game.status = :status', { status: GameStatus.Active })
        .andWhere(':userId IN (game.firstPlayerId, game.secondPlayerId)', {
          userId,
        })
        .getOne();
    } catch (error) {
      console.log(`getCurrentGameByUserId: ${error}`);
      throw new Error(`getCurrentGameByUserId: ${error}`);
    }
  }
  async getGameById(gameId: string, manager: EntityManager): Promise<QuizGame> {
    try {
      return manager
        .createQueryBuilder(QuizGame, 'game')
        .leftJoinAndSelect('game.firstPlayerProgress', 'fPP')
        .leftJoinAndSelect('game.secondPlayerProgress', 'sPP')
        .leftJoin('fPP.player', 'firstPlayer')
        .addSelect('firstPlayer.id')
        .leftJoin('sPP.player', 'secondPlayer')
        .addSelect('secondPlayer.id')
        .leftJoinAndSelect('game.questions', 'questions')
        .leftJoinAndSelect('fPP.answers', 'fppAnswers')
        .leftJoinAndSelect('sPP.answers', 'sppAnswers')
        .where('game.id = :gameId', { gameId })
        .getOne();
    } catch (error) {
      console.log(`getGameById: ${error}`);
      throw new Error(`getGameById: ${error}`);
    }
  }

  async findAnswerByText(
    answerText: string,
    playerId: string,
  ): Promise<QuizAnswer> {
    try {
      return this.quizAnswers.findOne({
        where: {
          answerText,
          playerProgress: { id: playerId },
        },
      });
    } catch (error) {
      throw new Error(`findAnswerByText: ${error}`);
    }
  }
}
