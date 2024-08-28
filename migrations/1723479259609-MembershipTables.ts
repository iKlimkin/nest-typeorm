import { MigrationInterface, QueryRunner } from "typeorm";

export class MembershipTables1723479259609 implements MigrationInterface {
    name = 'MembershipTables1723479259609'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "blog_subscription_plan_model" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "productId" character varying NOT NULL, "productTitle" character varying NOT NULL, "productPlan" character varying NOT NULL, "productPrice" integer NOT NULL, "productData" jsonb NOT NULL, CONSTRAINT "PK_67381d9601a0ff795cd665561ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "membership_blog_plan" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "subscribedAt" TIMESTAMP NOT NULL DEFAULT now(), "isActive" boolean NOT NULL DEFAULT true, "endDate" date, "blogId" uuid, "userId" uuid, "blogPlanModelId" uuid, CONSTRAINT "PK_588321cd7449661b2babde0085e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "payment_transaction_plan" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "paymentSystem" character varying NOT NULL, "price" integer NOT NULL, "paymentStatus" character varying NOT NULL, "paymentProviderInfo" jsonb, "paymentCheckoutInfo" jsonb, "membershipPlanId" uuid, "userId" uuid, CONSTRAINT "PK_15cfc985a0cb389102cb33b721c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "blog_notify_subscription" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "subscribeStatus" character varying NOT NULL, "userId" uuid, "blogId" uuid, CONSTRAINT "PK_722341cd25b5298be54ee197c23" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "blog" DROP COLUMN "isMembership"`);
        await queryRunner.query(`CREATE INDEX "title" ON "blog" ("title") `);
        await queryRunner.query(`ALTER TABLE "membership_blog_plan" ADD CONSTRAINT "FK_af22649618145f9eb154d229dac" FOREIGN KEY ("blogId") REFERENCES "blog"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "membership_blog_plan" ADD CONSTRAINT "FK_0383978d7e064c139b4a67c9e66" FOREIGN KEY ("userId") REFERENCES "user_account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "membership_blog_plan" ADD CONSTRAINT "FK_2e6868a75a6f1856d616889bc90" FOREIGN KEY ("blogPlanModelId") REFERENCES "blog_subscription_plan_model"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payment_transaction_plan" ADD CONSTRAINT "FK_50870708ec3514cc76e257507dc" FOREIGN KEY ("membershipPlanId") REFERENCES "membership_blog_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payment_transaction_plan" ADD CONSTRAINT "FK_f47b78839a2bf79fd0226dad48d" FOREIGN KEY ("userId") REFERENCES "user_account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "blog_notify_subscription" ADD CONSTRAINT "FK_418edbbb9ab0eba07a2483debbf" FOREIGN KEY ("userId") REFERENCES "user_account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "blog_notify_subscription" ADD CONSTRAINT "FK_ee876352d9d4b3d9965372553ae" FOREIGN KEY ("blogId") REFERENCES "blog"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "blog_notify_subscription" DROP CONSTRAINT "FK_ee876352d9d4b3d9965372553ae"`);
        await queryRunner.query(`ALTER TABLE "blog_notify_subscription" DROP CONSTRAINT "FK_418edbbb9ab0eba07a2483debbf"`);
        await queryRunner.query(`ALTER TABLE "payment_transaction_plan" DROP CONSTRAINT "FK_f47b78839a2bf79fd0226dad48d"`);
        await queryRunner.query(`ALTER TABLE "payment_transaction_plan" DROP CONSTRAINT "FK_50870708ec3514cc76e257507dc"`);
        await queryRunner.query(`ALTER TABLE "membership_blog_plan" DROP CONSTRAINT "FK_2e6868a75a6f1856d616889bc90"`);
        await queryRunner.query(`ALTER TABLE "membership_blog_plan" DROP CONSTRAINT "FK_0383978d7e064c139b4a67c9e66"`);
        await queryRunner.query(`ALTER TABLE "membership_blog_plan" DROP CONSTRAINT "FK_af22649618145f9eb154d229dac"`);
        await queryRunner.query(`DROP INDEX "public"."title"`);
        await queryRunner.query(`ALTER TABLE "blog" ADD "isMembership" boolean NOT NULL`);
        await queryRunner.query(`DROP TABLE "blog_notify_subscription"`);
        await queryRunner.query(`DROP TABLE "payment_transaction_plan"`);
        await queryRunner.query(`DROP TABLE "membership_blog_plan"`);
        await queryRunner.query(`DROP TABLE "blog_subscription_plan_model"`);
    }

}
