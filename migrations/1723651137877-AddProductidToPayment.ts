import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProductidToPayment1723651137877 implements MigrationInterface {
    name = 'AddProductidToPayment1723651137877'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payment_transaction_plan" ADD "productId" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payment_transaction_plan" DROP COLUMN "productId"`);
    }

}
