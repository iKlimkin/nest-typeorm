import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUniqUserPostInPostReaction1720791144739 implements MigrationInterface {
    name = 'AddUniqUserPostInPostReaction1720791144739'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "post_reaction" ADD CONSTRAINT "UQ_8f0e895fae24ab37d0f5eb53c2f" UNIQUE ("userId", "postId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "post_reaction" DROP CONSTRAINT "UQ_8f0e895fae24ab37d0f5eb53c2f"`);
    }

}
