import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { PaginationViewModel } from '../../../../domain/sorting-base-filter';
import { CreateUserErrors } from '../../../../infra/utils/interlay-error-handler.ts/error-constants';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { BasicSAAuthGuard } from '../../../auth/infrastructure/guards/basic-auth.guard';
import { CreateSACommand } from '../../application/commands/create-sa.command';
import { DeleteSACommand } from '../../application/commands/delete-sa.command';
import { CreateUserDto } from '../models/create-user.model';
import { SAQueryFilter } from '../models/outputSA.models.ts/sa-query.filter';
import { UserIdType } from '../models/outputSA.models.ts/user-models';
import { SAViewType } from '../models/userAdmin.view.models/userAdmin.view.model';
import { UsersQueryRepo } from '../query-repositories/users.query.repo';

@UseGuards(BasicSAAuthGuard)
@Controller('sa/users')
export class SAController {
  constructor(
    private usersQueryRepo: UsersQueryRepo,
    private commandBus: CommandBus,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getUserAdmins(
    @Query() query: SAQueryFilter,
  ): Promise<PaginationViewModel<SAViewType> | any> {
    return this.usersQueryRepo.getAllUsers(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getUserAdmin(@Param('id') userId: string): Promise<SAViewType | void> {
    const userAdmin = await this.usersQueryRepo.getUserById(userId);

    if (!userAdmin) {
      throw new NotFoundException();
    }

    return userAdmin;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createSA(@Body() body: CreateUserDto): Promise<SAViewType> {
    const command = new CreateSACommand(body);

    const result = await this.commandBus.execute<
      CreateSACommand,
      LayerNoticeInterceptor<UserIdType>
    >(command);

    if (result.hasError) {
      throw new InternalServerErrorException(result.extensions);
    }

    const foundNewestUser = await this.usersQueryRepo.getUserById(
      result.data!.userId,
    );

    return foundNewestUser!;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSA(@Param('id') userId: string): Promise<void> {
    const command = new DeleteSACommand(userId);

    await this.commandBus.execute<DeleteSACommand, boolean>(command);
  }
}
