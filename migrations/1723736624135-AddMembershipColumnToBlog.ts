import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMembershipColumnToBlog1723736624135 implements MigrationInterface {
    name = 'AddMembershipColumnToBlog1723736624135'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "blog" ADD "isMembership" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "blog" DROP COLUMN "isMembership"`);
    }

}
