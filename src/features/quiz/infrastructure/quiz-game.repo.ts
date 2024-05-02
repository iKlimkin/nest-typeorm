import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { OutputId } from '../../../domain/output.models';
import { LayerNoticeInterceptor } from '../../auth/api/controllers';
import { UserAccount } from '../../auth/infrastructure/settings';
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
    private readonly currentGameQuestions: Repository<CurrentGameQuestion>
  ) {}

  async saveQuestionAndAnswers(
    quizQuestion: QuizQuestion,
    quizAnswers: QuizCorrectAnswer[]
  ): Promise<QuestionId | null> {
    try {
      const savedQuestion = await this.quizQuestions.save(quizQuestion);

      await Promise.all(
        quizAnswers.map(async (answer) => {
          answer.question = savedQuestion;
          return this.quizCorrectAnswers.save(answer);
        })
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
    manager: EntityManager
  ): Promise<LayerNoticeInterceptor<OutputId> | null> {
    try {
      const savedQuizGame = await manager.save(QuizGame, quizGameDto);

      return new LayerNoticeInterceptor({
        id: savedQuizGame.id,
      });
    } catch (error) {
      return new LayerNoticeInterceptor(
        null,
        `saveGame finished with errors: ${error}`
      );
    }
  }

  async saveProgress(
    currentPlayerProgress: QuizPlayerProgress,
    manager: EntityManager
  ): Promise<QuizPlayerProgress> {
    try {
      return manager.save(QuizPlayerProgress, currentPlayerProgress);
    } catch (error) {
      console.log(`saveProgress finished with errors: ${error}`);
    }
  }

  async saveAnswer(
    answerDto: QuizAnswer,
    manager: EntityManager
  ): Promise<QuizAnswer> {
    try {
      return manager.save(answerDto);
    } catch (error) {
      console.log(`saveAnswer finished with errors: ${error}`);
      throw new InternalServerErrorException();
    }
  }

  async finishGame(gameId: string, manager: EntityManager): Promise<void> {
    try {
      await manager.update(QuizGame, gameId, {
        finishGameDate: new Date(),
        status: GameStatus.Finished,
      });
    } catch (error) {
      console.log(`finishGame operation was interrupted with errors: ${error}`);
      throw new InternalServerErrorException()
    }
  }

  async saveConnection(
    quizConnection: QuizGame,
    manager: EntityManager
  ): Promise<LayerNoticeInterceptor<QuizGame | null>> {
    try {
      const connectedPair = await manager.save(QuizGame, quizConnection);

      return new LayerNoticeInterceptor(connectedPair);
    } catch (error) {
      return new LayerNoticeInterceptor(
        null,
        `${error} occurred during save connection`
      );
    }
  }

  async updateQuestionAndAnswers(
    updateDto: UpdateQuestionData & { questionId: string }
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
        { body, updated_at: new Date() }
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
        `Database fails during delete quiz-question operation ${error}`
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
        `Database fails during publish question operation ${error}`
      );
      return false;
    }
  }

  // async getInformationOnPlayerProgress(
  //   firstPlayerId: string,
  //   secondPlayerId: string
  // ): Promise<{
  //   firstPlayerProgress: QuizPlayerProgress;
  //   progressOfSecondPlayer: QuizPlayerProgress;
  // } | null> {
  //   try {
  //     const firstPlayerProgress = await this.playerProgress.findOneBy({
  //       id: firstPlayerId,
  //     });

  //     const progressOfSecondPlayer = await this.playerProgress.findOneBy({
  //       id: secondPlayerId,
  //     });

  //     return { firstPlayerProgress, progressOfSecondPlayer };
  //   } catch (errors) {
  //     console.error(
  //       `Database fails during getPlayerProgressesInfo operation: ${errors}`
  //     );
  //     return null;
  //   }
  // }

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

  async getPendingPair(): Promise<LayerNoticeInterceptor<QuizGame | null>> {
    try {
      const pendingPair = await this.quizPairs.findOne({
        where: {
          status: GameStatus.PendingSecondPlayer,
          version: 1,
        },
      });

      return new LayerNoticeInterceptor(pendingPair);
    } catch (error) {
      return new LayerNoticeInterceptor(
        null,
        `${error} occurred during find pending pairs`
      );
    }
  }

  async getCurrentGameQuestion(
    gameId: string,
    order: number
  ): Promise<CurrentGameQuestion> {
    try {
      const result = await this.currentGameQuestions.findOne({
        where: {
          quizPair: { id: gameId },
          order,
        },
      });

      return result;
    } catch (error) {
      throw new InternalServerErrorException(`getNextQuestion: ${error}`);
    }
  }

  async getFiveRandomQuestions(
    manager: EntityManager
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
        `${error} occurred while searching the database for five random questions`
      );
    }
  }

  async saveCurrentGameQuestions(
    gameQuestions: CurrentGameQuestion[],
    manager: EntityManager
  ): Promise<void> {
    // | LayerNoticeInterceptor<null>
    try {
      await manager.save(CurrentGameQuestion, gameQuestions);
    } catch (error) {
      // return new LayerNoticeInterceptor(null, `${error} occurred while save questions`)
      throw new InternalServerErrorException(
        `${error} occurred while save questions`
      );
    }
  }

  async getAnswersForCurrentQuestion(
    questionId: string,
    manager: EntityManager
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
    manager: EntityManager
  ): Promise<QuizGame | null> {
    try {
      // const result = await manager
      //   .createQueryBuilder(QuizGame, 'game')
      //   .select()
      //   .leftJoinAndSelect('game.firstPlayerProgress', 'firstPlayerProgress')
      //   .leftJoinAndSelect('game.secondPlayerProgress', 'secondPlayerProgress')
      //   .leftJoinAndSelect('game.questions', 'questions')
      //   .where(
      //     '(game.firstPlayerId = :userId OR game.secondPlayerId = :userId)',
      //     {
      //       userId,
      //     }
      //   )
      //   .getOne();

      //   await manager.query('COMMIT');

      const result = await this.quizPairs
        .createQueryBuilder('game')
        .select()
        .leftJoinAndSelect('game.firstPlayerProgress', 'firstPlayerProgress')
        .leftJoinAndSelect('game.secondPlayerProgress', 'secondPlayerProgress')
        .leftJoinAndSelect('game.questions', 'questions')
        .where(
          '(game.firstPlayerId = :userId OR game.secondPlayerId = :userId)',
          {
            userId,
          }
        )
        .getOne();

      return result;
    } catch (error) {
      throw new InternalServerErrorException(
        `getCurrentGameByUserId: ${error}`
      );
    }
  }

  async findAnswerByText(
    answerText: string,
    playerId: string
  ): Promise<QuizAnswer> {
    try {
      return this.quizAnswers.findOne({
        where: {
          answerText,
          playerProgress: { id: playerId },
        },
      });
    } catch (error) {
      console.error(`findAnswerByText: ${error}`);
    }
  }
}
