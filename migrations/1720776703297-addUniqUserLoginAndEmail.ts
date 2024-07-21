import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUniqUserLoginAndEmail1720776703297 implements MigrationInterface {
    name = 'AddUniqUserLoginAndEmail1720776703297'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_account" ADD CONSTRAINT "UQ_9c4183ef80b974d1b11a5de05b1" UNIQUE ("login")`);
        await queryRunner.query(`ALTER TABLE "user_account" ADD CONSTRAINT "UQ_56a0e4bcec2b5411beafa47ffa5" UNIQUE ("email")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_account" DROP CONSTRAINT "UQ_56a0e4bcec2b5411beafa47ffa5"`);
        await queryRunner.query(`ALTER TABLE "user_account" DROP CONSTRAINT "UQ_9c4183ef80b974d1b11a5de05b1"`);
    }

}
