import { MigrationInterface, QueryRunner } from "typeorm";

export class AddColumnIsBanned1720713482870 implements MigrationInterface {
    name = 'AddColumnIsBanned1720713482870'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_bans" ADD "isBanned" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_bans" DROP COLUMN "isBanned"`);
    }

}
