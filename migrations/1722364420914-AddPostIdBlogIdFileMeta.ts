import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPostIdBlogIdFileMeta1722364420914 implements MigrationInterface {
    name = 'AddPostIdBlogIdFileMeta1722364420914'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "file_metadata" ALTER COLUMN "postId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "file_metadata" ALTER COLUMN "blogId" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "file_metadata" ALTER COLUMN "blogId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "file_metadata" ALTER COLUMN "postId" SET NOT NULL`);
    }

}
