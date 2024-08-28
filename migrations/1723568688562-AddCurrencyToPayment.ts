import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCurrencyToPayment1723568688562 implements MigrationInterface {
    name = 'AddCurrencyToPayment1723568688562'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payment_transaction_plan" ADD "currency" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payment_transaction_plan" DROP COLUMN "currency"`);
    }

}
