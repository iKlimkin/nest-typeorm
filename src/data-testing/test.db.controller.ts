import { Controller, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { TestDatabaseRepo } from './test.db.repo';

@Controller('testing/all-data')
export class TestDatabaseController {
  constructor(private testDatabaseRepo: TestDatabaseRepo) {}

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAllData() {
    await this.testDatabaseRepo.deleteAllData();
  }
}
