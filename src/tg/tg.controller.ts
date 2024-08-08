import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { TelegramAdapter } from '../infra/adapters/telegram.adapter';
import { TgService } from './application/tg.service';
import { CreateTgDto } from './dto/create-tg.dto';
import { UpdateTgDto } from './dto/update-tg.dto';
import { CommandBus } from '@nestjs/cqrs';

@Controller('notification')
export class TgController {
  constructor(
    private readonly tgService: TgService,
    private readonly tgAdapter: TelegramAdapter,
    private readonly commandBus: CommandBus,
  ) {}

  @Post()
  create(@Body() createTgDto: CreateTgDto) {
    return this.tgService.create(createTgDto);
  }

  @Get()
  findAll() {
    return this.tgService.findAll();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTgDto: UpdateTgDto) {
    return this.tgService.update(+id, updateTgDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tgService.remove(+id);
  }
}
