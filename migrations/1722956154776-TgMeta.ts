import { MigrationInterface, QueryRunner } from "typeorm";

export class TgMeta1722956154776 implements MigrationInterface {
    name = 'TgMeta1722956154776'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "telegram_meta_user" ADD "telegramId" character varying`);
        await queryRunner.query(`ALTER TABLE "telegram_meta_user" ADD "telegramUsername" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "telegram_meta_user" DROP COLUMN "telegramUsername"`);
        await queryRunner.query(`ALTER TABLE "telegram_meta_user" DROP COLUMN "telegramId"`);
    }

}
