import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBlogIdToSubBlogPlanModel1723548779455 implements MigrationInterface {
    name = 'AddBlogIdToSubBlogPlanModel1723548779455'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "blog_subscription_plan_model" ADD "blogId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "blog_subscription_plan_model" ADD CONSTRAINT "FK_d246607e785ee5137e30aa4de79" FOREIGN KEY ("blogId") REFERENCES "blog"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "blog_subscription_plan_model" DROP CONSTRAINT "FK_d246607e785ee5137e30aa4de79"`);
        await queryRunner.query(`ALTER TABLE "blog_subscription_plan_model" DROP COLUMN "blogId"`);
    }

}
