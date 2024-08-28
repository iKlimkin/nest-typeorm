import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSessionIdPaymentPlan1723649223309 implements MigrationInterface {
    name = 'AddSessionIdPaymentPlan1723649223309'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payment_transaction_plan" ADD "sessionId" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payment_transaction_plan" DROP CONSTRAINT "FK_50870708ec3514cc76e257507dc"`);
        await queryRunner.query(`ALTER TABLE "payment_transaction_plan" ADD CONSTRAINT "UQ_50870708ec3514cc76e257507dc" UNIQUE ("membershipPlanId")`);
        await queryRunner.query(`ALTER TABLE "payment_transaction_plan" ADD CONSTRAINT "FK_50870708ec3514cc76e257507dc" FOREIGN KEY ("membershipPlanId") REFERENCES "membership_blog_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payment_transaction_plan" DROP CONSTRAINT "FK_50870708ec3514cc76e257507dc"`);
        await queryRunner.query(`ALTER TABLE "payment_transaction_plan" DROP CONSTRAINT "UQ_50870708ec3514cc76e257507dc"`);
        await queryRunner.query(`ALTER TABLE "payment_transaction_plan" ADD CONSTRAINT "FK_50870708ec3514cc76e257507dc" FOREIGN KEY ("membershipPlanId") REFERENCES "membership_blog_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payment_transaction_plan" DROP COLUMN "sessionId"`);
    }

}
