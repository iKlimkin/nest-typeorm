import { MigrationInterface, QueryRunner } from "typeorm";

export class AdjustBlogPlanModel1723563543312 implements MigrationInterface {
    name = 'AdjustBlogPlanModel1723563543312'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "blog_subscription_plan_model" ADD "productPriceInCents" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "membership_blog_plan" ALTER COLUMN "subscribedAt" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "membership_blog_plan" ALTER COLUMN "subscribedAt" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "membership_blog_plan" ALTER COLUMN "isActive" SET DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "payment_transaction_plan" ALTER COLUMN "paymentProviderInfo" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payment_transaction_plan" ALTER COLUMN "paymentProviderInfo" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "membership_blog_plan" ALTER COLUMN "isActive" SET DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "membership_blog_plan" ALTER COLUMN "subscribedAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "membership_blog_plan" ALTER COLUMN "subscribedAt" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "blog_subscription_plan_model" DROP COLUMN "productPriceInCents"`);
    }

}
