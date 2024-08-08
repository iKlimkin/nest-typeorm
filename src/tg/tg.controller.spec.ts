import { Test, TestingModule } from '@nestjs/testing';
import { TgController } from './tg.controller';
import { TgService } from './application/tg.service';

describe('TgController', () => {
  let controller: TgController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TgController],
      providers: [TgService],
    }).compile();

    controller = module.get<TgController>(TgController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
