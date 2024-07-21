import { MigrationInterface, QueryRunner } from "typeorm";

export class UserCollateLoginEmail1721386870954 implements MigrationInterface {
    name = 'UserCollateLoginEmail1721386870954'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_account" ALTER COLUMN "login" SET DATA TYPE VARCHAR COLLATE "C"`);
        await queryRunner.query(`ALTER TABLE "user_account" ALTER COLUMN "email" SET DATA TYPE VARCHAR COLLATE "C"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_account" ALTER COLUMN "login" SET DATA TYPE VARCHAR`);
        await queryRunner.query(`ALTER TABLE "user_account" ALTER COLUMN "email" SET DATA TYPE VARCHAR`);
    }

}
