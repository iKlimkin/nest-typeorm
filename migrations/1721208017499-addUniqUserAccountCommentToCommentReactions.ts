import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUniqUserAccountCommentToCommentReactions1721208017499 implements MigrationInterface {
    name = 'AddUniqUserAccountCommentToCommentReactions1721208017499'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "comment_reaction" ADD CONSTRAINT "UQ_997dba4c97eee524590b27fbbba" UNIQUE ("commentId", "userAccountId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "comment_reaction" DROP CONSTRAINT "UQ_997dba4c97eee524590b27fbbba"`);
    }

}
