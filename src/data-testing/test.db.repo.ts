import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class TestDatabaseRepo {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async deleteAllData() {
    try {
      await this.dataSource.query(`
      TRUNCATE TABLE temporary_user_account;
      TRUNCATE TABLE user_session CASCADE;
      TRUNCATE TABLE user_account CASCADE;
      TRUNCATE TABLE post CASCADE;
      TRUNCATE TABLE blog CASCADE;
      TRUNCATE TABLE comment CASCADE;
    `);
    } catch (error) {
      console.error('Error executing queries:', error);
    }
  }
}
