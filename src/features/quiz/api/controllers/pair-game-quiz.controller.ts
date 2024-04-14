import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  AccessTokenGuard,
  CurrentUserInfo,
  UserSessionDto,
} from '../../../comments/api/controllers';

@UseGuards(AccessTokenGuard)
@Controller('pair-game-quiz/pairs')
export class PairGameQuizController {
  constructor(
    private readonly commandBus: CommandBus,
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
  async connectUser(@CurrentUserInfo() userInfo: UserSessionDto) {}
  
  @Post('my-current/answers')
  async sendAnswer(@CurrentUserInfo() userInfo: UserSessionDto) {}
}
