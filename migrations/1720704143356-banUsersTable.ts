import { MigrationInterface, QueryRunner } from "typeorm";

export class BanUsersTable1720704143356 implements MigrationInterface {
    name = 'BanUsersTable1720704143356'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_bans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "banReason" text NOT NULL, "banEndDate" TIMESTAMP WITH TIME ZONE, "userId" uuid, CONSTRAINT "REL_92ac403b4ae72ccffb7a551c5a" UNIQUE ("userId"), CONSTRAINT "PK_299b3ce7e72a9ac9aec5edeaf81" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user_bans" ADD CONSTRAINT "FK_92ac403b4ae72ccffb7a551c5a5" FOREIGN KEY ("userId") REFERENCES "user_account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_bans" DROP CONSTRAINT "FK_92ac403b4ae72ccffb7a551c5a5"`);
        await queryRunner.query(`DROP TABLE "user_bans"`);
    }

}
