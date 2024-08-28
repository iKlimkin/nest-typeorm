import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCurrencyToBlogPlan1723551065437 implements MigrationInterface {
    name = 'AddCurrencyToBlogPlan1723551065437'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "blog_subscription_plan_model" ADD "productCurrency" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "blog_subscription_plan_model" DROP COLUMN "productCurrency"`);
    }

}
