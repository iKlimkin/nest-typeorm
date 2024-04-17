import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuizGame } from '../domain/entities/quiz-game.entity';
import { QuizQuestion } from '../domain/entities/quiz-question.entity';
import { QuizAnswer } from '../domain/entities/quiz-answer.entity';
import { getQuestionViewModel } from '../api/models/output.models.ts/view.models.ts/quiz-question.view-model';
import { QuestionId } from '../api/models/output.models.ts/output.types';
import { UpdateQuestionData } from '../api/models/input.models/update-question.model';
import { PlayerProgress } from '../domain/entities/quiz-player-progress.entity';
import { OutputId } from '../../../domain/output.models';
import { GameStatus } from '../api/models/input.models/statuses.model';
import { UserAccount } from '../../auth/infrastructure/settings';

@Injectable()
export class QuizRepository {
  constructor(
    @InjectRepository(QuizGame)
    private readonly quizPairs: Repository<QuizGame>,
    @InjectRepository(QuizQuestion)
    private readonly quizQuestions: Repository<QuizQuestion>,
    @InjectRepository(QuizAnswer)
    private readonly quizAnswers: Repository<QuizAnswer>,
    @InjectRepository(PlayerProgress)
    private readonly playerProgress: Repository<PlayerProgress>
  ) {}

  async saveQuestionAndAnswers(
    quizQuestion: QuizQuestion,
    quizAnswers: QuizAnswer[]
  ): Promise<QuestionId | null> {
    try {
      const savedQuestion = await this.quizQuestions.save(quizQuestion);

      await Promise.all(
        quizAnswers.map(async (answer) => {
          answer.question = savedQuestion;
          return await this.quizAnswers.save(answer);
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
    firstPlayer: PlayerProgress
  ): Promise<OutputId | null> {
    try {
      const savedProgress = await this.playerProgress.save(firstPlayer);

      const createdQuizGame = this.quizPairs.create({
        firstPlayer: quizGameDto.firstPlayer,
        status: quizGameDto.status,
      });
      createdQuizGame.firstPlayer.gameProgress = savedProgress;
      
debugger
      const savedQuizGame = await this.quizPairs.save(createdQuizGame);

      // await this.playerProgress.update(
      //   { id: savedFirstPlayer.id },
      //   { game: savedQuizGame }
      // );

      return {
        id: savedQuizGame.id,
      };
    } catch (error) {
      console.log(`saveGame finished with errors: ${error}`);
      return null;
    }
  }

  async connect(
    secondPlayer: UserAccount,
    secondPlayerDto: PlayerProgress,
    pairsToConnect: QuizGame[]
  ): Promise<OutputId | null> {
    try {
      const savedSecondPlayerProgress =
        await this.playerProgress.save(secondPlayerDto);
      const firstPairToConnect = pairsToConnect[0];
      debugger
      firstPairToConnect.secondPlayer = secondPlayer;
      firstPairToConnect.secondPlayer.gameProgress = savedSecondPlayerProgress;
      firstPairToConnect.status = GameStatus.Active;
      firstPairToConnect.startGameDate = new Date();

      const updatedPair = await this.quizPairs.save(firstPairToConnect);

      // await this.playerProgress.update(
      //   { id: savedSecondPlayerProgress.id },
      //   { user: secondPlayer }
      // );

      return {
        id: updatedPair.id,
      };
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

      const formerAnswers = await this.quizAnswers
        .createQueryBuilder('qa')
        .where('question_id = :questionId', { questionId })
        .getMany();

      for (let i = 0; i < correctAnswers.length; i++) {
        const answerText = correctAnswers[i];
        const formerAnswer = formerAnswers[i];

        if (formerAnswer) {
          await this.quizAnswers.update(formerAnswer.id, { answerText });
        } else {
          const quizAnswer = this.quizAnswers.create({
            question: {
              id: questionId,
            },
            answerText,
            isCorrect: true,
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
      // const deleteAnswers = await this.quizAnswers.delete({
      //   question: { id: questionId },
      // });

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
      });

      return result.affected !== 0;
    } catch (error) {
      console.error(
        `Database fails during delete quiz-question operation ${error}`
      );
      return false;
    }
  }

  async getPendingPairs(): Promise<QuizGame[]> {
    try {
      const pendingPairs = await this.quizPairs.find({
        where: { status: GameStatus.PendingSecondPlayer },
      });

      return pendingPairs;
    } catch (error) {
      throw new InternalServerErrorException(`getPendingPairs: ${error}`);
    }
  }
}
