import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class TestDatabaseRepo {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async deleteAllData() {
    try {
      await this.dataSource.query(`
      TRUNCATE TABLE user_account CASCADE;
      TRUNCATE TABLE quiz_game CASCADE;
      TRUNCATE TABLE quiz_question CASCADE;
      TRUNCATE TABLE quiz_answer;
      TRUNCATE TABLE user_session;
      TRUNCATE TABLE post CASCADE;
      TRUNCATE TABLE blog CASCADE;
      TRUNCATE TABLE comment CASCADE;
      TRUNCATE TABLE temporary_user_account;
    `);
    } catch (error) {
      console.error('Error executing queries:', error);
    }
  }
}
