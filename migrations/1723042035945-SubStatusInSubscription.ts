import { MigrationInterface, QueryRunner } from "typeorm";

export class SubStatusInSubscription1723042035945 implements MigrationInterface {
    name = 'SubStatusInSubscription1723042035945'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "subscription" ADD "subscribeStatus" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "subscription" DROP COLUMN "subscribeStatus"`);
    }

}
