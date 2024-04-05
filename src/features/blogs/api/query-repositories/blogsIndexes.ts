import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class AddIndexesToBlogs implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createIndex(
      'blogs',
      new TableIndex({
        name: 'IDX_BLOGS_TITLE',
        columnNames: ['title'],
      }),
    );

    await queryRunner.createIndex(
      'blogs',
      new TableIndex({
        name: 'IDX_BLOGS_CREATED_AT',
        columnNames: ['created_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('blogs', 'IDX_BLOGS_TITLE');
    await queryRunner.dropIndex('blogs', 'IDX_BLOGS_CREATED_AT');
  }
}
