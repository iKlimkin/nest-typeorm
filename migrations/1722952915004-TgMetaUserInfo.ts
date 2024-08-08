import { MigrationInterface, QueryRunner } from "typeorm";

export class TgMetaUserInfo1722952915004 implements MigrationInterface {
    name = 'TgMetaUserInfo1722952915004'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "telegram_meta_user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid NOT NULL, "telegramActivationCode" character varying, CONSTRAINT "REL_974de2dbc91ce73baea5bf25c1" UNIQUE ("userId"), CONSTRAINT "PK_43a19f2855e39dbd017e767efc5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user_account" DROP COLUMN "telegramActivationCode"`);
        await queryRunner.query(`ALTER TABLE "telegram_meta_user" ADD CONSTRAINT "FK_974de2dbc91ce73baea5bf25c1a" FOREIGN KEY ("userId") REFERENCES "user_account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "telegram_meta_user" DROP CONSTRAINT "FK_974de2dbc91ce73baea5bf25c1a"`);
        await queryRunner.query(`ALTER TABLE "user_account" ADD "telegramActivationCode" character varying`);
        await queryRunner.query(`DROP TABLE "telegram_meta_user"`);
    }

}
