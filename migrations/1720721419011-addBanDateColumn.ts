import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBanDateColumn1720721419011 implements MigrationInterface {
    name = 'AddBanDateColumn1720721419011'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_bans" ADD "banDate" TIMESTAMP WITH TIME ZONE DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "user_bans" ALTER COLUMN "banReason" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_bans" ALTER COLUMN "banReason" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_bans" DROP COLUMN "banDate"`);
    }

}
