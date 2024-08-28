import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RouterPaths } from '../../../../infra/utils/routing';
import { PaginationViewModel } from '../../../../domain/sorting-base-filter';
import { BasicSAAuthGuard } from '../../../auth/infrastructure/guards/basic-auth.guard';
import { SACrudApiService } from '../../../../domain/base-services/base.crud.api.service';
import { BanUnbanCommand } from '../../application/commands/banUnban.command';
import { CreateSACommand } from '../../application/commands/create-sa.command';
import { DeleteSACommand } from '../../application/commands/delete-sa.command';
import { CreateUserDto } from '../models/input-sa.dtos.ts/create-user.model';
import { UserRestrictionDto } from '../models/input-sa.dtos.ts/user-restriction.dto';
import { SAQueryFilter } from '../models/outputSA.models.ts/query-filters';
import { SAViewType } from '../models/user.view.models/userAdmin.view-type';
import { UsersQueryRepo } from '../query-repositories/users.query.repo';

@UseGuards(BasicSAAuthGuard)
@Controller(RouterPaths.users)
export class SAController {
  constructor(
    private usersQueryRepo: UsersQueryRepo,
    private saCrudApiService: SACrudApiService<
      CreateSACommand | BanUnbanCommand | DeleteSACommand
    >,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getUsers(
    @Query() query: SAQueryFilter,
  ): Promise<PaginationViewModel<SAViewType>> {
    return this.usersQueryRepo.getAllUsers(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createSA(@Body() body: CreateUserDto): Promise<SAViewType> {
    const createCommand = new CreateSACommand(body);
    return this.saCrudApiService.create(createCommand);
  }

  @Put(':id/ban')
  @HttpCode(HttpStatus.NO_CONTENT)
  async banUnbanRestriction(
    @Param('id') userId: string,
    @Body() body: UserRestrictionDto,
  ) {
    const command = new BanUnbanCommand({ userId, ...body });
    return this.saCrudApiService.updateOrDelete(command);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSA(@Param('id') userId: string): Promise<void> {
    const command = new DeleteSACommand(userId);
    return this.saCrudApiService.updateOrDelete(command);
  }
}
