import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectEntityManager } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { UserAccount } from '../features/auth/infrastructure/settings';

@Injectable()
export class TestDatabaseRepo {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    @InjectEntityManager() private manager: EntityManager,
  ) {}

  async deleteAllData() {
    try {
      const usersRepo = this.dataSource.getRepository(UserAccount);
      // usersRepo.clear()
      // this.manager.clear(UserAccount)

      // TRUNCATE TABLE quiz_question CASCADE;
      // TRUNCATE TABLE quiz_player_progress CASCADE;
      // TRUNCATE TABLE quiz_answer;
      await this.dataSource.query(`
      TRUNCATE TABLE user_account CASCADE;
      TRUNCATE TABLE quiz_game CASCADE;
      TRUNCATE TABLE quiz_question CASCADE;
      TRUNCATE TABLE quiz_correct_answer CASCADE;
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
