import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1712736376447 implements MigrationInterface {
    name = 'Init1712736376447'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "api_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "ip" character varying NOT NULL, "url" character varying NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_c501a5bd89c34d626ba15d37ded" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "api_requests"`);
    }

}
