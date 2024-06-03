import { HttpServer, INestApplication } from '@nestjs/common';
import { cleanDatabase } from '../../../../test/tools/utils/dataBaseCleanup';
import { initSettings } from '../../../../test/tools/utils/initSettings';
import { ConnectPlayerCommand } from '../application/commands/connect-player.command';
import { ConnectPlayerUseCase } from '../application/use-cases/connect-player.use-case';
import { DataSource } from 'typeorm';
import { UsersRepository } from '../../admin/infrastructure/users.repo';
import { CreatePairUseCase } from '../application/use-cases/create-pair.use-case';
import { QuizRepository } from '../infrastructure/quiz-game.repo';
import { MockUserRepo } from './mock/mockUserRepo';
import { userSession } from './mock/shared';
import { QuizRepoMockForConnect } from './mock/quizRepoMock';

describe('Connect-pair.use-case', () => {
  let app: INestApplication;
  let httpServer: HttpServer;
  let connectPlayerUseCase: ConnectPlayerUseCase;
  let dataSource: DataSource;
  let userRepo: UsersRepository;
  let quizRepo: QuizRepository;
  let createPairUseCase: CreatePairUseCase;
  let quizRepoMock: QuizRepoMockForConnect;
  let userRepoMock: MockUserRepo;

  beforeAll(async () => {
    const settings = await initSettings((moduleBuilder) =>
      moduleBuilder
        .overrideProvider(UsersRepository)
        .useClass(MockUserRepo)
        .overrideProvider(QuizRepository)
        .useClass(QuizRepoMockForConnect),
    );
    app = settings.app;
    httpServer = settings.httpServer;
    dataSource = settings.testingAppModule.get(DataSource);

    quizRepoMock = new QuizRepoMockForConnect();
    userRepoMock = new MockUserRepo();
    userRepo = app.get(UsersRepository);
    quizRepo = app.get(QuizRepository);

    connectPlayerUseCase = app.get(ConnectPlayerUseCase);
  });

  afterAll(async () => {
    await cleanDatabase(httpServer);
    await app.close();
  });

  describe('positive cases', () => {
    beforeAll(async () => {
      await cleanDatabase(httpServer);
    });

    it('check validation of operations during connect to an existing pair', async () => {
      const getUserSpy = jest
        .spyOn(userRepo, 'getUserById')
        .mockImplementation(userRepoMock.getUserById);

      const pendingPairSpy = jest
        .spyOn(quizRepo, 'getPendingPair')
        .mockImplementation(quizRepoMock.getPendingPair);

      const saveProgressSpy = jest
        .spyOn(quizRepo, 'saveProgress')
        .mockImplementation(quizRepoMock.saveProgress);

      const saveGameSpy = jest
        .spyOn(quizRepo, 'saveConnection')
        .mockImplementation(quizRepoMock.saveConnection);

      const command = new ConnectPlayerCommand(userSession);

      const result = await connectPlayerUseCase.execute(command);
      // expect(result.data).toEqual({ id: '123' });
      // expect(result.code).toBe(0);

      expect(pendingPairSpy).toHaveBeenCalled();
      expect(getUserSpy).toHaveBeenCalled();
      expect(saveGameSpy).toHaveBeenCalled();
      expect(saveProgressSpy).toHaveBeenCalled();
    });
  });

  describe.skip('negative cases', () => {
    beforeAll(async () => {
      await cleanDatabase(httpServer);
    });

    it('connecting to an existing pair', async () => {
      const command = new ConnectPlayerCommand({
        deviceId: '12321',
        userId: '12321',
      });
      const res = await connectPlayerUseCase.execute(command);

      expect(res).toBe(undefined);
    });
  });
});
