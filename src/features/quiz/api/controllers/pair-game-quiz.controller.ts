import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  AccessTokenGuard,
  CurrentUserInfo,
  UserSessionDto,
} from '../../../comments/api/controllers';
import { RouterPaths } from '../../../../../test/tools/helpers/routing';
import { QuizQueryRepo } from '../models/query-repositories/quiz.query.repo';
import { ConnectPlayerCommand } from '../../application/commands/connect-player.command';
import { CreatePairCommand } from '../../application/commands/create-pair.command';
import {
  LayerNoticeInterceptor,
  OutputId,
  handleErrors,
} from '../../../blogs/api/controllers';
import {
  AnswerResultViewType,
  QuizPairViewType,
} from '../models/output.models.ts/view.models.ts/quiz-game.view-type';
import { InputAnswerModel } from '../models/input.models/answer.model';
import { SetPlayerAnswerCommand } from '../../application/commands/set-player-answer.command';
import { QuizService } from '../../application/quiz.service';

@UseGuards(AccessTokenGuard)
@Controller(RouterPaths.quizPairs)
export class PairGameQuizController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly quizQueryRepo: QuizQueryRepo,
    private readonly quizService: QuizService
  ) {}

  @Get('my-current')
  async getCurrentUnfinishedGame(
    @CurrentUserInfo() userInfo: UserSessionDto
  ): Promise<QuizPairViewType> {
    const result = await this.quizQueryRepo.getCurrentUnfinishedGame(
      userInfo.userId
    );

    if (!result) {
      throw new NotFoundException('Game not found');
    }

    return result;
  }

  @Get(':id')
  async getGame(
    @CurrentUserInfo() userInfo: UserSessionDto,
    @Param('id') gameId: string
  ): Promise<QuizPairViewType> {
    const game = await this.quizQueryRepo.getPairInformation(gameId);

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    if (
      game.firstPlayerProgress.player.id !== userInfo.userId &&
      game.secondPlayerProgress.player.id !== userInfo.userId
    ) {
      throw new ForbiddenException('Current user is not a participant');
    }

    return game;
  }

  @Post('connection')
  @HttpCode(HttpStatus.OK)
  async connectOrCreatePair(
    @CurrentUserInfo() userInfo: UserSessionDto
  ): Promise<QuizPairViewType> {
    const userInGame = await this.quizQueryRepo.isUserInGame(userInfo.userId);

    if (userInGame) throw new ForbiddenException('User already in game');

    const pendingPair = await this.quizQueryRepo.getPendingPair();

    if (pendingPair) {
      const command = new ConnectPlayerCommand(userInfo);

      const result = await this.commandBus.execute<
        ConnectPlayerCommand,
        LayerNoticeInterceptor<OutputId | null>
      >(command);

      if (result.hasError()) {
        const command = new CreatePairCommand(userInfo);
        const result = await this.commandBus.execute<
          CreatePairCommand,
          LayerNoticeInterceptor<OutputId | null>
        >(command);

        if (result.hasError()) {
          const errors = handleErrors(result.code, result.extensions[0]);
          throw errors.error;
        }

        return this.quizQueryRepo.getPairInformation(result.data.id);
      }

      return this.quizQueryRepo.getPairInformation(result.data.id);
    }

    const command = new CreatePairCommand(userInfo);
    const result = await this.commandBus.execute<
      CreatePairCommand,
      LayerNoticeInterceptor<OutputId | null>
    >(command);

    if (result.hasError()) {
      const errors = handleErrors(result.code, result.extensions[0]);
      throw errors.error;
    }

    return this.quizQueryRepo.getPairInformation(result.data.id);
  }

  @Post('my-current/answers')
  async sendAnswer(
    @CurrentUserInfo() userInfo: UserSessionDto,
    @Body() body: InputAnswerModel
  ): Promise<AnswerResultViewType | any> {
    const userInGame = await this.quizQueryRepo.isUserInGame(userInfo.userId);

    if (!userInGame) throw new ForbiddenException('non-player user');

    const command = new SetPlayerAnswerCommand({
      answer: body.answer,
      userId: userInfo.userId,
    });

    const result = await this.commandBus.execute<
      SetPlayerAnswerCommand,
      LayerNoticeInterceptor<AnswerResultViewType>
    >(command);

    if (result.hasError()) {
      const errors = handleErrors(result.code, result.extensions[0]);
      throw errors.error;
    } else {
      return result.data;
    }
  }

  @Get('test')
  async testComprehension(@CurrentUserInfo() userInfo: UserSessionDto) {
    return this.quizService.testComprehension(userInfo);
  }
}
