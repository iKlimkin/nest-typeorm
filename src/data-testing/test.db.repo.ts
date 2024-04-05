import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class TestDatabaseRepo {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async deleteAllData() {
    try {
      await this.dataSource.query(`
      DELETE FROM post_reactions_m;
      DELETE FROM post_reaction_counts_m;
      DELETE FROM comment_reactions_m;
      DELETE FROM comment_reaction_counts_m;
      DELETE FROM comments;
      DELETE FROM posts;
      DELETE FROM blogs;
      DELETE FROM user_sessions;
      DELETE FROM user_accounts;
      DELETE FROM api_requests;
      TRUNCATE TABLE temporary_user_account;
      TRUNCATE TABLE user_session CASCADE;
      TRUNCATE TABLE user_account CASCADE;
      TRUNCATE TABLE post CASCADE;
      TRUNCATE TABLE blog CASCADE;
      TRUNCATE TABLE comment CASCADE;
    `);
    } catch (error) {
      console.error('Error executing SQL queries:', error);
    }
  }
}
