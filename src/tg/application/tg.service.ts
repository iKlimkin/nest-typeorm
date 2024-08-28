import { Injectable } from '@nestjs/common';
import { CreateTgDto } from '../dto/create-tg.dto';
import { UpdateTgDto } from '../dto/update-tg.dto';

@Injectable()
export class TgService {
  create(createTgDto: CreateTgDto) {
    return 'This action adds a new tg';
  }

  findAll() {
    return `This action returns all tg`;
  }

  findOne(id: number) {
    return `This action returns a #${id} tg`;
  }

  update(id: number, updateTgDto: UpdateTgDto) {
    return `This action updates a #${id} tg`;
  }

  remove(id: number) {
    return `This action removes a #${id} tg`;
  }
}
