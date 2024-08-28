import { AsyncLocalStorage } from 'async_hooks';
import {
  AppModule,
  ConfigService,
  ConfigurationType,
  NestFactory,
  applyAppSettings,
  visualizeStartApp,
} from '.';
import { ASYNC_STORAGE } from './logger/logger.constants';
import { PinoLoggerService } from './logger/pino-logger.service';
import { v4 as uuidv4 } from 'uuid';

(async () => {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });
  const configService = app.get(ConfigService<ConfigurationType>);
  const PORT = configService.getOrThrow('port');

  app.use((req, res, next) => {
    const asyncStorage = app.get(ASYNC_STORAGE);
    const traceId = req.headers['x-request-id'] || uuidv4();
    const store = new Map().set('traceId', traceId);
    asyncStorage.run(store, () => {
      next();
    });
  });
  app.useLogger(app.get(PinoLoggerService));

  applyAppSettings(app);

  await app.listen(PORT, () => {
    console.log(visualizeStartApp(PORT));
  });
})();
