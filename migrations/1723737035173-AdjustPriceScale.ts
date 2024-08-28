import { MigrationInterface, QueryRunner } from "typeorm";

export class AdjustPriceScale1723737035173 implements MigrationInterface {
    name = 'AdjustPriceScale1723737035173'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "blog_subscription_plan_model" DROP COLUMN "productPrice"`);
        await queryRunner.query(`ALTER TABLE "blog_subscription_plan_model" ADD "productPrice" numeric(10,2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payment_transaction_plan" DROP COLUMN "price"`);
        await queryRunner.query(`ALTER TABLE "payment_transaction_plan" ADD "price" numeric(10,2) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payment_transaction_plan" DROP COLUMN "price"`);
        await queryRunner.query(`ALTER TABLE "payment_transaction_plan" ADD "price" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "blog_subscription_plan_model" DROP COLUMN "productPrice"`);
        await queryRunner.query(`ALTER TABLE "blog_subscription_plan_model" ADD "productPrice" integer NOT NULL`);
    }

}
