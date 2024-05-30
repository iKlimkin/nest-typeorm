import { MigrationInterface, QueryRunner } from "typeorm";

export class BlogIdPOST1716490530096 implements MigrationInterface {
    name = 'BlogIdPOST1716490530096'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "blog" DROP CONSTRAINT "FK_08dfe0c802192ba0c499d4cdb9c"`);
        await queryRunner.query(`ALTER TABLE "post" DROP CONSTRAINT "FK_8770b84ec0b63d5c726a0681df4"`);
        await queryRunner.query(`ALTER TABLE "comment_reaction" DROP CONSTRAINT "UQ_1d6be5df3cc9d32e2bc5f0e1e55"`);
        await queryRunner.query(`ALTER TABLE "post" RENAME COLUMN "blog_id" TO "blogId"`);
        await queryRunner.query(`ALTER TABLE "blog" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "comment" DROP COLUMN "user_login"`);
        await queryRunner.query(`ALTER TABLE "post" DROP COLUMN "blogId"`);
        await queryRunner.query(`ALTER TABLE "post" ADD "blogId" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "post" ADD CONSTRAINT "UQ_d0418ddc42c5707dbc37b05bef9" UNIQUE ("blogId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "post" DROP CONSTRAINT "UQ_d0418ddc42c5707dbc37b05bef9"`);
        await queryRunner.query(`ALTER TABLE "post" DROP COLUMN "blogId"`);
        await queryRunner.query(`ALTER TABLE "post" ADD "blogId" uuid`);
        await queryRunner.query(`ALTER TABLE "comment" ADD "user_login" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "blog" ADD "user_id" uuid`);
        await queryRunner.query(`ALTER TABLE "post" RENAME COLUMN "blogId" TO "blog_id"`);
        await queryRunner.query(`ALTER TABLE "comment_reaction" ADD CONSTRAINT "UQ_1d6be5df3cc9d32e2bc5f0e1e55" UNIQUE ("comment_id", "user_id")`);
        await queryRunner.query(`ALTER TABLE "post" ADD CONSTRAINT "FK_8770b84ec0b63d5c726a0681df4" FOREIGN KEY ("blog_id") REFERENCES "blog"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "blog" ADD CONSTRAINT "FK_08dfe0c802192ba0c499d4cdb9c" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
