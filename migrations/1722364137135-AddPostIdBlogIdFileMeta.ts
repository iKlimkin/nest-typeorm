import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPostIdBlogIdFileMeta1722364137135 implements MigrationInterface {
    name = 'AddPostIdBlogIdFileMeta1722364137135'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "file_metadata" ADD "postId" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "file_metadata" ADD "blogId" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "file_metadata" DROP COLUMN "blogId"`);
        await queryRunner.query(`ALTER TABLE "file_metadata" DROP COLUMN "postId"`);
    }

}
