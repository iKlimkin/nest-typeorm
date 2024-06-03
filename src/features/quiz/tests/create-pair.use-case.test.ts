import { HttpServer, HttpStatus, INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { cleanDatabase } from '../../../../test/tools/utils/dataBaseCleanup';
import { initSettings } from '../../../../test/tools/utils/initSettings';
import { UsersRepository } from '../../auth/infrastructure/settings';
import { CreatePairCommand } from '../application/commands/create-pair.command';
import { CreatePairUseCase } from '../application/use-cases/create-pair.use-case';
import { QuizRepository } from '../infrastructure/quiz-game.repo';
import { MockUserRepo } from './mock/mockUserRepo';
import { QuizRepoMockForCreate } from './mock/quizRepoMock';
import { userSession } from './mock/shared';

describe('Create-pair.use-case', () => {
  const location = 'CreatePairUseCase';
  let app: INestApplication;
  let dataSource: DataSource;
  let httpServer: HttpServer;
  let createPairUseCase: CreatePairUseCase;
  let quizRepoMock: QuizRepoMockForCreate;
  let userRepoMock: MockUserRepo;
  let userRepo: UsersRepository;
  let quizRepo: QuizRepository;

  beforeAll(async () => {
    const settings = await initSettings((moduleBuilder) =>
      moduleBuilder
        .overrideProvider(UsersRepository)
        .useClass(MockUserRepo)
        .overrideProvider(QuizRepository)
        .useClass(QuizRepoMockForCreate),
    );
    app = settings.app;
    httpServer = settings.httpServer;
    dataSource = settings.testingAppModule.get(DataSource);

    createPairUseCase = app.get(CreatePairUseCase);
    quizRepoMock = new QuizRepoMockForCreate();
    userRepoMock = new MockUserRepo();
    userRepo = app.get(UsersRepository);
    quizRepo = app.get(QuizRepository);
  });

  afterAll(async () => {
    await cleanDatabase(httpServer);
    await app.close();
  });

  describe('testing positive cases', () => {
    beforeAll(async () => {
      await cleanDatabase(httpServer);
    });

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('check validation of operations', async () => {
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
        .spyOn(quizRepo, 'saveGame')
        .mockImplementation(quizRepoMock.saveGame);

      const command = new CreatePairCommand(userSession);
      const result = await createPairUseCase.execute(command);
      expect(result.data).toEqual({ id: '123' });
      expect(result.code).toBe(0);

      expect(pendingPairSpy).toHaveBeenCalled();
      expect(getUserSpy).toHaveBeenCalled();
      expect(saveGameSpy).toHaveBeenCalled();
      expect(saveProgressSpy).toHaveBeenCalled();
    });
  });

  describe('testing negative cases', () => {
    beforeAll(async () => {
      await cleanDatabase(httpServer);
    });
    beforeEach(() => {
      const createPairUseCase = new CreatePairUseCase(
        quizRepoMock as QuizRepository,
        userRepoMock as UsersRepository,
        dataSource,
      );

      expect.setState({ createPairUseCase });
    });

    it('testing call createPair.use-case without instance of appropriate command', async () => {
      const { createPairUseCase } = expect.getState();
      const mockCommand = { createData: userSession };

      const result = await createPairUseCase.execute(mockCommand);

      expect(result.data).toBeNull();
      expect(result.code).toBe(HttpStatus.BAD_REQUEST);
      expect(result.extensions[0]).toEqual({
        message: 'incorrect model',
        key: location,
      });
    });
    it('testing user not found, 404', async () => {
      const { createPairUseCase } = expect.getState();

      userRepoMock.getUserById = jest.fn().mockReturnValueOnce(null);

      const result = await createPairUseCase.execute(
        new CreatePairCommand(userSession),
      );

      expect(result.data).toBeNull();
      expect(result.code).toBe(404);
      expect(result.extensions[0]).toEqual({
        message: 'user not found',
        key: location,
      });
    });

    it('testing pending pair already exists, 404', async () => {
      const { createPairUseCase } = expect.getState();

      quizRepoMock.getPendingPair = jest
        .fn()
        .mockReturnValueOnce({ data: true });

      const result = await createPairUseCase.execute(
        new CreatePairCommand(userSession),
      );

      expect(result.data).toBeNull();
      expect(result.code).toBe(403);
      expect(result.extensions[0]).toEqual({
        message: 'there is already a pending pair',
        key: location,
      });
    });

    it('testing saveProgress, roleBack transaction', async () => {
      const { createPairUseCase } = expect.getState();

      quizRepoMock.saveProgress = jest.fn().mockReturnValueOnce(null);

      const resultBadProgress = await createPairUseCase.execute(
        new CreatePairCommand(userSession),
      );

      expect(resultBadProgress.data).toBeNull();
    });
    // starts only test => predictable conduct, all tests => error
    it.skip('testing saveGame', async () => {
      const { createPairUseCase } = expect.getState();

      quizRepoMock.saveGame = jest.fn().mockReturnValueOnce({ data: null });

      const resultBadSaveGame = await createPairUseCase.execute(
        new CreatePairCommand(userSession),
      );

      expect(resultBadSaveGame.data).toBeNull();
      expect(resultBadSaveGame.code).toBe(500);
      expect(resultBadSaveGame.extensions[0]).toEqual({
        key: location,
        message: 'error occurred during save game',
      });
    });
  });
});
