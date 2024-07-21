import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIndexToFieldIsBanned1720801331752 implements MigrationInterface {
    name = 'AddIndexToFieldIsBanned1720801331752'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_banned" ON "user_bans" ("isBanned") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_banned"`);
    }

}
