import { MigrationInterface, QueryRunner } from "typeorm";

export class BlogAndPostChangeName1720279731506 implements MigrationInterface {
    name = 'BlogAndPostChangeName1720279731506'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // await queryRunner.query(`ALTER TABLE "post" DROP COLUMN "short_description"`);
        // await queryRunner.query(`ALTER TABLE "post" DROP COLUMN "blog_title"`);
        // await queryRunner.query(`ALTER TABLE "post" ADD "shortDescription" character varying NOT NULL`);
        // await queryRunner.query(`ALTER TABLE "post" ADD "blogTitle" character varying NOT NULL`);
        // await queryRunner.query(`ALTER TABLE "post" DROP CONSTRAINT "UQ_d0418ddc42c5707dbc37b05bef9"`);
        // await queryRunner.query(`ALTER TABLE "post" DROP COLUMN "blogId"`);
        // await queryRunner.query(`ALTER TABLE "post" ADD "blogId" uuid`);
        // await queryRunner.query(`ALTER TABLE "post" ADD CONSTRAINT "FK_d0418ddc42c5707dbc37b05bef9" FOREIGN KEY ("blogId") REFERENCES "blog"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "post" DROP CONSTRAINT "FK_d0418ddc42c5707dbc37b05bef9"`);
        await queryRunner.query(`ALTER TABLE "post" DROP COLUMN "blogId"`);
        await queryRunner.query(`ALTER TABLE "post" ADD "blogId" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "post" ADD CONSTRAINT "UQ_d0418ddc42c5707dbc37b05bef9" UNIQUE ("blogId")`);
        await queryRunner.query(`ALTER TABLE "post" DROP COLUMN "blogTitle"`);
        await queryRunner.query(`ALTER TABLE "post" DROP COLUMN "shortDescription"`);
        await queryRunner.query(`ALTER TABLE "post" ADD "blog_title" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "post" ADD "short_description" character varying NOT NULL`);
    }

}
