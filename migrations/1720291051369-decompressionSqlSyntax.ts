import { MigrationInterface, QueryRunner } from "typeorm";

export class DecompressionSqlSyntax1720291051369 implements MigrationInterface {
    name = 'DecompressionSqlSyntax1720291051369'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "post_reaction" DROP CONSTRAINT "FK_30ae9db858e049c9fcb6f9c2b38"`);
        await queryRunner.query(`ALTER TABLE "post_reaction" DROP CONSTRAINT "FK_860c24b55da4541f8322a2bdced"`);
        await queryRunner.query(`ALTER TABLE "comment_reaction" DROP CONSTRAINT "FK_f8e54702e8418719a786c60fcd2"`);
        await queryRunner.query(`ALTER TABLE "comment_reaction" DROP CONSTRAINT "FK_962582f04d3f639e33f43c54bbc"`);
        await queryRunner.query(`ALTER TABLE "post_reaction" DROP COLUMN "reaction_type"`);
        await queryRunner.query(`ALTER TABLE "post_reaction" DROP COLUMN "user_login"`);
        await queryRunner.query(`ALTER TABLE "post_reaction" DROP COLUMN "post_id"`);
        await queryRunner.query(`ALTER TABLE "post_reaction" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "comment_reaction" DROP COLUMN "reaction_type"`);
        await queryRunner.query(`ALTER TABLE "comment_reaction" DROP COLUMN "comment_id"`);
        await queryRunner.query(`ALTER TABLE "comment_reaction" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "post_reaction" ADD "reactionType" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "post_reaction" ADD "userLogin" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "post_reaction" ADD "postId" uuid`);
        await queryRunner.query(`ALTER TABLE "post_reaction" ADD "userId" uuid`);
        await queryRunner.query(`ALTER TABLE "comment_reaction" ADD "reactionType" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "comment_reaction" ADD "commentId" uuid`);
        await queryRunner.query(`ALTER TABLE "comment_reaction" ADD "userAccountId" uuid`);
        await queryRunner.query(`ALTER TABLE "post_reaction" ADD CONSTRAINT "FK_5e7b98f3cea583c73a0bbbe0de1" FOREIGN KEY ("postId") REFERENCES "post"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "post_reaction" ADD CONSTRAINT "FK_5019c594c963270ac7a6bfafbec" FOREIGN KEY ("userId") REFERENCES "user_account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comment_reaction" ADD CONSTRAINT "FK_88bb607240417f03c0592da6824" FOREIGN KEY ("commentId") REFERENCES "comment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comment_reaction" ADD CONSTRAINT "FK_040330df817d50edb24dfbc929d" FOREIGN KEY ("userAccountId") REFERENCES "user_account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "comment_reaction" DROP CONSTRAINT "FK_040330df817d50edb24dfbc929d"`);
        await queryRunner.query(`ALTER TABLE "comment_reaction" DROP CONSTRAINT "FK_88bb607240417f03c0592da6824"`);
        await queryRunner.query(`ALTER TABLE "post_reaction" DROP CONSTRAINT "FK_5019c594c963270ac7a6bfafbec"`);
        await queryRunner.query(`ALTER TABLE "post_reaction" DROP CONSTRAINT "FK_5e7b98f3cea583c73a0bbbe0de1"`);
        await queryRunner.query(`ALTER TABLE "comment_reaction" DROP COLUMN "userAccountId"`);
        await queryRunner.query(`ALTER TABLE "comment_reaction" DROP COLUMN "commentId"`);
        await queryRunner.query(`ALTER TABLE "comment_reaction" DROP COLUMN "reactionType"`);
        await queryRunner.query(`ALTER TABLE "post_reaction" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "post_reaction" DROP COLUMN "postId"`);
        await queryRunner.query(`ALTER TABLE "post_reaction" DROP COLUMN "userLogin"`);
        await queryRunner.query(`ALTER TABLE "post_reaction" DROP COLUMN "reactionType"`);
        await queryRunner.query(`ALTER TABLE "comment_reaction" ADD "user_id" uuid`);
        await queryRunner.query(`ALTER TABLE "comment_reaction" ADD "comment_id" uuid`);
        await queryRunner.query(`ALTER TABLE "comment_reaction" ADD "reaction_type" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "post_reaction" ADD "user_id" uuid`);
        await queryRunner.query(`ALTER TABLE "post_reaction" ADD "post_id" uuid`);
        await queryRunner.query(`ALTER TABLE "post_reaction" ADD "user_login" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "post_reaction" ADD "reaction_type" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "comment_reaction" ADD CONSTRAINT "FK_962582f04d3f639e33f43c54bbc" FOREIGN KEY ("comment_id") REFERENCES "comment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comment_reaction" ADD CONSTRAINT "FK_f8e54702e8418719a786c60fcd2" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "post_reaction" ADD CONSTRAINT "FK_860c24b55da4541f8322a2bdced" FOREIGN KEY ("post_id") REFERENCES "post"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "post_reaction" ADD CONSTRAINT "FK_30ae9db858e049c9fcb6f9c2b38" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
