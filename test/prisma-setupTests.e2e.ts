import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from '../src/core/config/configuration';
import { execSync } from 'child_process';
import { DatabaseService } from '../src/core/db/prisma/prisma.service';
import { join } from 'path';
import { databaseCleanUp } from './tools/utils/db-cleanUp';
import { Environment } from '@shared/environment.enum';

let databaseService: DatabaseService;
let config: ConfigService<EnvironmentVariables>;
let dbCleaner: () => Promise<void>;
beforeAll(async () => {
  config = new ConfigService();
  // config.set('ENV', Environment.TESTING);
  const dbUrl = config.get('DATABASE_URL_FOR_TESTS');

  const workerDir = join(__dirname, '..');

  // execSync('npx prisma migrate dev', {
  //   env: { DATABASE_URL: dbUrl },
  //   cwd: workerDir,
  // });

  // databaseService = new DatabaseService({
  //   datasources: {
  //     db: { url: dbUrl },
  //   },
  //   log: ['query'],
  // });
  console.log('connected to test db...');
  databaseService = new DatabaseService(config);

  dbCleaner = databaseCleanUp.bind(null, databaseService);
  await dbCleaner();
});

afterAll(async () => {
  await databaseService.$disconnect();
});

export { databaseService, dbCleaner };
