import { MigrationInterface, QueryRunner } from "typeorm";

export class DeleteBlogTitleIndex1720616403189 implements MigrationInterface {
    name = 'DeleteBlogTitleIndex1720616403189'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."title"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE UNIQUE INDEX "title" ON "blog" ("title") `);
    }

}
