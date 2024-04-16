import {
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
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

@UseGuards(AccessTokenGuard)
@Controller(RouterPaths.quizPairs)
export class PairGameQuizController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly quizQueryRepo: QuizQueryRepo
  ) {}

  @Get('my-current')
  async getCurrentUnfinishedGame(
    @CurrentUserInfo() userInfo: UserSessionDto
  ): Promise<any> {}

  @Get('pairs/:id')
  async getGame(
    @CurrentUserInfo() userInfo: UserSessionDto,
    @Param('id') gameId: string
  ): Promise<any> {}

  @Post('connection')
  @HttpCode(HttpStatus.OK)
  async connectOrCreatePair(@CurrentUserInfo() userInfo: UserSessionDto) {
    const userInGame = await this.quizQueryRepo.isUserInGame(userInfo.userId);

    if (userInGame) throw new ForbiddenException('User already in game');

    // const pendingPairs = await this.quizQueryRepo.getPendingPairs();

    // if (pendingPairs.length) {
    //   const command = new ConnectPlayerCommand(userInfo);
    //   const result = await this.commandBus.execute<
    //     ConnectPlayerCommand,
    //     LayerNoticeInterceptor<OutputId | null>
    //   >(command);

    //   if (result.hasError()) {
    //     const errors = handleErrors(result.code, result.extensions[0]);
    //     throw errors.error;
    //   }
    //   return;
    //   // return this.quizQueryRepo.getPairInformation(result.data.id);
    // }

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
  async sendAnswer(@CurrentUserInfo() userInfo: UserSessionDto) {}
}
