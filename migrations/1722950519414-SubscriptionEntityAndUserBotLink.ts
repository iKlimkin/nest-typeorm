import { MigrationInterface, QueryRunner } from "typeorm";

export class SubscriptionEntityAndUserBotLink1722950519414 implements MigrationInterface {
    name = 'SubscriptionEntityAndUserBotLink1722950519414'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "subscription" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, "blogId" uuid, CONSTRAINT "PK_8c3e00ebd02103caa1174cd5d9d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user_account" ADD "telegramActivationCode" character varying`);
        await queryRunner.query(`ALTER TABLE "blog_image" DROP CONSTRAINT "UQ_ce8d6380d907e85a4216d89d409"`);
        await queryRunner.query(`ALTER TABLE "blog_image" DROP COLUMN "blogId"`);
        await queryRunner.query(`ALTER TABLE "blog_image" ADD "blogId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "blog_image" ADD CONSTRAINT "UQ_ce8d6380d907e85a4216d89d409" UNIQUE ("blogId")`);
        await queryRunner.query(`ALTER TABLE "subscription" ADD CONSTRAINT "FK_cc906b4bc892b048f1b654d2aa0" FOREIGN KEY ("userId") REFERENCES "user_account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subscription" ADD CONSTRAINT "FK_1633935b96d51b8d69d0ea1bebf" FOREIGN KEY ("blogId") REFERENCES "blog"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "blog_image" ADD CONSTRAINT "FK_ce8d6380d907e85a4216d89d409" FOREIGN KEY ("blogId") REFERENCES "blog"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "blog_image" DROP CONSTRAINT "FK_ce8d6380d907e85a4216d89d409"`);
        await queryRunner.query(`ALTER TABLE "subscription" DROP CONSTRAINT "FK_1633935b96d51b8d69d0ea1bebf"`);
        await queryRunner.query(`ALTER TABLE "subscription" DROP CONSTRAINT "FK_cc906b4bc892b048f1b654d2aa0"`);
        await queryRunner.query(`ALTER TABLE "blog_image" DROP CONSTRAINT "UQ_ce8d6380d907e85a4216d89d409"`);
        await queryRunner.query(`ALTER TABLE "blog_image" DROP COLUMN "blogId"`);
        await queryRunner.query(`ALTER TABLE "blog_image" ADD "blogId" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "blog_image" ADD CONSTRAINT "UQ_ce8d6380d907e85a4216d89d409" UNIQUE ("blogId")`);
        await queryRunner.query(`ALTER TABLE "user_account" DROP COLUMN "telegramActivationCode"`);
        await queryRunner.query(`DROP TABLE "subscription"`);
    }

}
