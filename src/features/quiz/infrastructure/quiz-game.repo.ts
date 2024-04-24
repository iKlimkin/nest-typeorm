import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { QuizGame } from '../domain/entities/quiz-game.entity';
import { QuizQuestion } from '../domain/entities/quiz-questions.entity';
import { QuizAnswer } from '../domain/entities/quiz-answer.entity';
import { getQuestionViewModel } from '../api/models/output.models.ts/view.models.ts/quiz-question.view-model';
import { QuestionId } from '../api/models/output.models.ts/output.types';
import { UpdateQuestionData } from '../api/models/input.models/update-question.model';
import { QuizPlayerProgress } from '../domain/entities/quiz-player-progress.entity';
import { OutputId } from '../../../domain/output.models';
import { GameStatus } from '../api/models/input.models/statuses.model';
import { UserAccount } from '../../auth/infrastructure/settings';
import { QuizCorrectAnswer } from '../domain/entities/quiz-correct-answers.entity';
import { CurrentGameQuestion } from '../domain/entities/current-game-questions.entity';

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
    firstPlayerProgress: QuizPlayerProgress
  ): Promise<OutputId | null> {
    try {
      const savedProgress = await this.playerProgress.save(firstPlayerProgress);

      const createdQuizGame = this.quizPairs.create({
        firstPlayerProgress: savedProgress,
        firstPlayerId: savedProgress.player.id,
        status: quizGameDto.status,
      });

      const savedQuizGame = await this.quizPairs.save(createdQuizGame);

      return {
        id: savedQuizGame.id,
      };
    } catch (error) {
      console.log(`saveGame finished with errors: ${error}`);
      return null;
    }
  }

  async savePlayerProgress(
    currentPlayerProgress: QuizPlayerProgress
  ): Promise<void> {
    try {
      await this.playerProgress.save(currentPlayerProgress);
    } catch (error) {
      console.log(`savePlayerProgress finished with errors: ${error}`);
    }
  }

  async finishGame(gameId: string): Promise<void> {
    try {
      await this.quizPairs.update(gameId, {
        finishGameDate: new Date(),
        status: GameStatus.Finished,
      });
    } catch (error) {
      console.log(`finishGame operation was interrupted with errors: ${error}`);
    }
  }

  async connect(
    secondPlayer: UserAccount,
    secondPlayerProgress: QuizPlayerProgress,
    pairToConnect: QuizGame
  ): Promise<QuizGame | null> {
    try {
      const savedSecondPlayerProgress =
        await this.playerProgress.save(secondPlayerProgress);

      pairToConnect.secondPlayerId = secondPlayer.id;
      pairToConnect.secondPlayerProgress = secondPlayerProgress;
      pairToConnect.status = GameStatus.Active;
      pairToConnect.startGameDate = new Date();
      ++pairToConnect.version;

      const updatedPair = await this.quizPairs.save(pairToConnect);

      return updatedPair;
    } catch (error) {
      console.log(`connect finished with errors: ${error}`);
      return null;
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

  async getInformationOnPlayerProgress(
    firstPlayerId: string,
    secondPlayerId: string
  ): Promise<{
    firstPlayerProgress: QuizPlayerProgress;
    secondPlayerProgress: QuizPlayerProgress;
  } | null> {
    try {
      const firstPlayerProgress = await this.playerProgress.findOneBy({
        id: firstPlayerId,
      });

      const secondPlayerProgress = await this.playerProgress.findOneBy({
        id: secondPlayerId,
      });

      return { firstPlayerProgress, secondPlayerProgress };
    } catch (errors) {
      console.error(
        `Database fails during getPlayerProgressesInfo operation: ${errors}`
      );
      return null;
    }
  }

  // async grantBonusForEarlyCompletion(
  //   gameId: string,
  //   userId: string
  // ): Promise<boolean> {
  //   try {
  //   } catch (error) {
  //     console.error(
  //       `Database fails during delete quiz-question operation ${error}`
  //     );
  //     return false;
  //   }
  // }

  async getPlayerById(playerId: string): Promise<QuizPlayerProgress> {
    try {
      return this.playerProgress.findOne({
        where: { id: playerId },
      });
    } catch (error) {
      throw new InternalServerErrorException(`getPlayerById: ${error}`);
    }
  }

  async getPendingPair(): Promise<QuizGame> {
    try {
      const pendingPair = await this.quizPairs.findOne({
        where: {
          status: GameStatus.PendingSecondPlayer,
          version: 1,
        },
      });

      return pendingPair;
    } catch (error) {
      throw new InternalServerErrorException(`getPendingPairs: ${error}`);
    }
  }

  async getNextQuestion(
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

  async getFiveRandomQuestions(): Promise<QuizQuestion[]> {
    try {
      const randomQuestions = await this.quizQuestions
        .createQueryBuilder('q')
        .select()
        .where('q.published = :published', { published: true })
        .orderBy('RANDOM()')
        .limit(5)
        .getMany();

      return randomQuestions;
    } catch (error) {
      throw new InternalServerErrorException(
        `getFiveRandomQuestions: ${error}`
      );
    }
  }

  async saveCurrentGameQuestions(
    gameQuestions: CurrentGameQuestion[]
  ): Promise<void> {
    try {
      const savedGameQuestions =
        await this.currentGameQuestions.save(gameQuestions);
    } catch (error) {
      throw new InternalServerErrorException(
        `saveCurrentGameQuestions: ${error}`
      );
    }
  }

  async checkAnswer(answer: string, questionId: string): Promise<boolean> {
    try {
      const answers = await this.quizCorrectAnswers.find({
        where: {
          question: { id: questionId },
        },
      });

      if (!answers.length) return false;

      const isCorrectAnswer = answers.some(
        (correctAnswer) => correctAnswer.answerText === answer
      );

      return isCorrectAnswer;
    } catch (error) {
      console.error(`checkAnswer: ${error}`);
      return false;
    }
  }

  async getCurrentGameByUserId(userId: string): Promise<QuizGame> {
    try {
      const result = await this.quizPairs
        .createQueryBuilder('game')
        .select('game.id, firstPlayer.id, secondPlayer.id')
        .leftJoin('game.firstPlayerProgress', 'firstPlayer')
        .leftJoin('game.secondPlayerProgress', 'secondPlayer')
        .where('(firstPlayer.id = :userId OR secondPlayer.id = :userId)', {
          userId,
        })
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
        where: { answerText, playerProgress: { id: playerId } },
      });
    } catch (error) {
      console.error(`findAnswerByText: ${error}`);
    }
  }
}
