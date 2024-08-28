import { MigrationInterface, QueryRunner } from "typeorm";

export class AdjustOptialFieldsUserAccount1724768586047 implements MigrationInterface {
    name = 'AdjustOptialFieldsUserAccount1724768586047'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_account" DROP COLUMN "password_salt"`);
        await queryRunner.query(`ALTER TABLE "user_account" ALTER COLUMN "password_hash" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_account" ALTER COLUMN "confirmation_code" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_account" ALTER COLUMN "confirmation_expiration_date" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_account" ALTER COLUMN "confirmation_expiration_date" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_account" ALTER COLUMN "confirmation_code" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_account" ALTER COLUMN "password_hash" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_account" ADD "password_salt" character varying NOT NULL`);
    }

}
