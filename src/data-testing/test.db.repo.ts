import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectEntityManager } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { UserAccount } from '../features/admin/domain/entities/user-account.entity';

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

      await this.dataSource.query(`
      TRUNCATE TABLE user_account CASCADE;
      TRUNCATE TABLE user_bans CASCADE;
      TRUNCATE TABLE quiz_game CASCADE;
      TRUNCATE TABLE quiz_question CASCADE;
      TRUNCATE TABLE quiz_player_progress CASCADE;
      TRUNCATE TABLE quiz_answer;
      TRUNCATE TABLE quiz_correct_answer CASCADE;
      TRUNCATE TABLE user_session;
      TRUNCATE TABLE post CASCADE;
      TRUNCATE TABLE post_reaction CASCADE;
      TRUNCATE TABLE post_reaction_counts CASCADE;
      TRUNCATE TABLE blog CASCADE;
      TRUNCATE TABLE comment CASCADE;
      TRUNCATE TABLE comment_reaction CASCADE;
      TRUNCATE TABLE comment_reaction_counts CASCADE;
      TRUNCATE TABLE temporary_user_account;
    `);
    } catch (error) {
      console.error('Error executing queries:', error);
    }
  }
}
