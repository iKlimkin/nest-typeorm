import { INestApplication, HttpServer } from '@nestjs/common';
import { cleanDatabase } from '../../../../test/tools/utils/dataBaseCleanup';
import { initSettings } from '../../../../test/tools/utils/initSettings';
import { SetPlayerAnswerCommand } from '../application/commands/set-player-answer.command';
import { ConnectPlayerUseCase } from '../application/use-cases/connect-player.use-case';
import { SetPlayerAnswerUseCase } from '../application/use-cases/set-player-answer.use-case';

describe('Connect-pair', () => {
  let app: INestApplication;
  let httpServer: HttpServer;
  let setPlayerAnswerUseCase: SetPlayerAnswerUseCase;

  beforeAll(async () => {
    const settings = await initSettings(
      (moduleBuilder) => moduleBuilder,
      //   .overrideProvider(UsersRepository)
      //   .useClass(MockUserRepo)
      //   .overrideProvider(QuizRepository)
      //   .useClass(QuizRepoMock)
    );
    app = settings.app;
    httpServer = settings.httpServer;

    setPlayerAnswerUseCase = app.get(SetPlayerAnswerUseCase);
  });

  afterAll(async () => {
    await cleanDatabase(httpServer);
    await app.close();
  });

  describe('', () => {
    beforeAll(async () => {
      await cleanDatabase(httpServer);
    });

    it('', async () => {
      const command = new SetPlayerAnswerCommand({
        userId: '12321',
        answer: 'answer',
      });
      const res = await setPlayerAnswerUseCase.execute(command);

      expect(res).toBe(undefined);
    });
  });
});
