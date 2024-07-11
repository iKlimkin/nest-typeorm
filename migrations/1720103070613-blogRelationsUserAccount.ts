import { MigrationInterface, QueryRunner } from "typeorm";

export class BlogRelationsUserAccount1720103070613 implements MigrationInterface {
    name = 'BlogRelationsUserAccount1720103070613'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // await queryRunner.query(`ALTER TABLE "blog" DROP CONSTRAINT "FK_fc46ede0f7ab797b7ffacb5c08d"`);
        // await queryRunner.query(`ALTER TABLE "blog" DROP COLUMN "website_url"`);
        // await queryRunner.query(`ALTER TABLE "blog" DROP COLUMN "is_membership"`);
        // await queryRunner.query(`ALTER TABLE "blog" DROP COLUMN "userId"`);
        // await queryRunner.query(`ALTER TABLE "blog" ADD "websiteUrl" character varying NOT NULL`);
        // await queryRunner.query(`ALTER TABLE "blog" ADD "isMembership" boolean NOT NULL`);
        // await queryRunner.query(`ALTER TABLE "blog" ADD "ownerId" uuid`);
        // await queryRunner.query(`ALTER TABLE "blog" ADD CONSTRAINT "FK_2168be0207735471e4dc0f72bb0" FOREIGN KEY ("ownerId") REFERENCES "user_account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "blog" DROP CONSTRAINT "FK_2168be0207735471e4dc0f72bb0"`);
        await queryRunner.query(`ALTER TABLE "blog" DROP COLUMN "ownerId"`);
        await queryRunner.query(`ALTER TABLE "blog" DROP COLUMN "isMembership"`);
        await queryRunner.query(`ALTER TABLE "blog" DROP COLUMN "websiteUrl"`);
        await queryRunner.query(`ALTER TABLE "blog" ADD "userId" uuid`);
        await queryRunner.query(`ALTER TABLE "blog" ADD "is_membership" boolean NOT NULL`);
        await queryRunner.query(`ALTER TABLE "blog" ADD "website_url" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "blog" ADD CONSTRAINT "FK_fc46ede0f7ab797b7ffacb5c08d" FOREIGN KEY ("userId") REFERENCES "user_account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
