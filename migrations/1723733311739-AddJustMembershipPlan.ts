import { MigrationInterface, QueryRunner } from "typeorm";

export class AddJustMembershipPlan1723733311739 implements MigrationInterface {
    name = 'AddJustMembershipPlan1723733311739'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "membership_blog_plan" ALTER COLUMN "subscribedAt" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "membership_blog_plan" ALTER COLUMN "isActive" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "membership_blog_plan" ALTER COLUMN "endDate" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "membership_blog_plan" ALTER COLUMN "endDate" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "membership_blog_plan" ALTER COLUMN "isActive" SET DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "membership_blog_plan" ALTER COLUMN "subscribedAt" DROP NOT NULL`);
    }

}
