import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProviderIdToUser1724781577445 implements MigrationInterface {
    name = 'AddProviderIdToUser1724781577445'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_account" ADD "providerId" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_account" DROP COLUMN "providerId"`);
    }

}
