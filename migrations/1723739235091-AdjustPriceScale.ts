import { MigrationInterface, QueryRunner } from "typeorm";

export class AdjustPriceScale1723739235091 implements MigrationInterface {
    name = 'AdjustPriceScale1723739235091'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "blog_subscription_plan_model" DROP COLUMN "productPriceInCents"`);
        await queryRunner.query(`ALTER TABLE "blog_subscription_plan_model" ADD "productPriceInCents" numeric(10,2) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "blog_subscription_plan_model" DROP COLUMN "productPriceInCents"`);
        await queryRunner.query(`ALTER TABLE "blog_subscription_plan_model" ADD "productPriceInCents" integer NOT NULL`);
    }

}
