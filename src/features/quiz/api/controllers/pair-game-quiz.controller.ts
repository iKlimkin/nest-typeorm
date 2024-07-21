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
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { RouterPaths } from '../../../../../test/tools/helpers/routing';
import { ValidateIdPipe } from '../../../../infra/pipes/id-validate.pipe';

import {
  AccessTokenGuard,
  CurrentUserInfo,
  UserSessionDto,
} from '../../../comments/api/controllers';
import { ConnectPlayerCommand } from '../../application/commands/connect-player.command';
import { CreatePairCommand } from '../../application/commands/create-pair.command';
import { SetPlayerAnswerCommand } from '../../application/commands/set-player-answer.command';
import { QuizService } from '../../application/services/quiz-crud-api.service';
import { QuizTestService } from '../../application/services/quiz.test.service';
import { InputAnswerModel } from '../models/input.models/answer.model';
import {
  QuizGamesQueryFilter,
  StatsQueryFilter,
} from '../models/input.models/quiz-games-query.filter';
import { GameStatus } from '../models/input.models/statuses.model';
import { PlayerStatsView } from '../models/output.models.ts/view.models.ts/quiz-game-analyze';
import {
  AnswerResultViewType,
  QuizPairViewType,
} from '../models/output.models.ts/view.models.ts/quiz-game.view-type';
import { QuizQueryRepo } from '../models/query-repositories/quiz.query.repo';
import { PaginationViewModel } from '../../../../domain/sorting-base-filter';
import { handleErrors } from '../../../../infra/utils/interlay-error-handler.ts/interlay-errors.handler';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';

@Controller(RouterPaths.quiz)
export class PairGameQuizController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly quizQueryRepo: QuizQueryRepo,
    private readonly quizService: QuizTestService,
    private readonly quizCrudApiService: QuizService,
  ) {}

  @Get('users/top')
  async getTopUsers(
    @Query() query: StatsQueryFilter,
  ): Promise<PaginationViewModel<PlayerStatsView>> {
    return this.quizQueryRepo.getUsersTop(query);
  }

  @UseGuards(AccessTokenGuard)
  @Get('pairs/my')
  async getAllUserGames(
    @CurrentUserInfo() userInfo: UserSessionDto,
    @Query() query: QuizGamesQueryFilter,
  ): Promise<PaginationViewModel<QuizPairViewType>> {
    return this.quizQueryRepo.getUserGames(userInfo.userId, query);
  }

  @UseGuards(AccessTokenGuard)
  @Get('users/my-statistic')
  async getUserStatistic(
    @CurrentUserInfo() userInfo: UserSessionDto,
  ): Promise<any> {
    return this.quizQueryRepo.getUserGameAnalytic(userInfo.userId);
  }

  @UseGuards(AccessTokenGuard)
  @Get('pairs/my-current')
  async getCurrentUnfinishedGame(
    @CurrentUserInfo() userInfo: UserSessionDto,
  ): Promise<QuizPairViewType> {
    const result = await this.quizQueryRepo.getCurrentUnfinishedGame(
      userInfo.userId,
    );

    if (!result) {
      throw new NotFoundException('Game not found');
    }

    if (
      result.firstPlayerProgress.player.id !== userInfo.userId &&
      result.secondPlayerProgress?.player.id !== userInfo.userId
    ) {
      throw new ForbiddenException('Current user is not a participant');
    }

    return result;
  }

  @UseGuards(AccessTokenGuard)
  @Get('pairs/:id')
  async getGame(
    @CurrentUserInfo() userInfo: UserSessionDto,
    @Param('id', ValidateIdPipe) gameId: string,
  ): Promise<QuizPairViewType> {
    const game = await this.quizQueryRepo.getPairInformation(gameId);

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    if (
      game.firstPlayerProgress.player.id !== userInfo.userId &&
      game.secondPlayerProgress?.player.id !== userInfo.userId
    ) {
      throw new ForbiddenException('Current user is not a participant');
    }

    return game;
  }

  @UseGuards(AccessTokenGuard)
  @Post('pairs/connection')
  @HttpCode(HttpStatus.OK)
  async connectOrCreatePair(
    @CurrentUserInfo() userInfo: UserSessionDto,
  ): Promise<QuizPairViewType> {
    const userInGame = await this.quizQueryRepo.isUserInGame(userInfo.userId);

    if (userInGame) throw new ForbiddenException('User already in active game');

    const pendingPair = await this.quizQueryRepo.getPendingPair();
    const command = pendingPair
      ? new ConnectPlayerCommand(userInfo)
      : new CreatePairCommand(userInfo);

    return this.quizCrudApiService.joinOrCreatePair(command);
  }

  @UseGuards(AccessTokenGuard)
  @Post('pairs/my-current/answers')
  @HttpCode(HttpStatus.OK)
  async sendAnswer(
    @CurrentUserInfo() userInfo: UserSessionDto,
    @Body() body: InputAnswerModel,
  ): Promise<AnswerResultViewType> {
    const userInGameStatus = await this.quizQueryRepo.isUserInGame(
      userInfo.userId,
    );

    if (
      !userInGameStatus ||
      userInGameStatus === GameStatus.PendingSecondPlayer
    )
      throw new ForbiddenException(
        'non-player user or the pair is not assembled',
      );

    const command = new SetPlayerAnswerCommand({
      answer: body.answer,
      userId: userInfo.userId,
    });

    const result = await this.commandBus.execute<
      SetPlayerAnswerCommand,
      LayerNoticeInterceptor<AnswerResultViewType>
    >(command);

    if (result.hasError) {
      const errors = handleErrors(result.code, result.extensions[0]);
      throw errors.error;
    } else {
      return result.data;
    }
  }

  @Get('test/test')
  async testComprehension(@CurrentUserInfo() userInfo: UserSessionDto) {
    return this.quizService.testComprehension(userInfo);
  }
}
