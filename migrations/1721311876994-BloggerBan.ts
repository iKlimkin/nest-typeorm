import { MigrationInterface, QueryRunner } from "typeorm";

export class BloggerBan1721311876994 implements MigrationInterface {
    name = 'BloggerBan1721311876994'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_blogger_bans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "banReason" text, "banEndDate" TIMESTAMP WITH TIME ZONE, "banDate" TIMESTAMP DEFAULT now(), "isBanned" boolean NOT NULL DEFAULT false, "blogId" uuid, "userId" uuid, CONSTRAINT "REL_1de847783cdf5005899142b665" UNIQUE ("blogId"), CONSTRAINT "PK_a24fb73bcd9782d1e097e438eea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user_bans" DROP COLUMN "banDate"`);
        await queryRunner.query(`ALTER TABLE "user_bans" ADD "banDate" TIMESTAMP DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "user_blogger_bans" ADD CONSTRAINT "FK_1de847783cdf5005899142b6654" FOREIGN KEY ("blogId") REFERENCES "blog"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_blogger_bans" ADD CONSTRAINT "FK_2db2622d5fc5e5d6803371103cf" FOREIGN KEY ("userId") REFERENCES "user_account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_blogger_bans" DROP CONSTRAINT "FK_2db2622d5fc5e5d6803371103cf"`);
        await queryRunner.query(`ALTER TABLE "user_blogger_bans" DROP CONSTRAINT "FK_1de847783cdf5005899142b6654"`);
        await queryRunner.query(`ALTER TABLE "user_bans" DROP COLUMN "banDate"`);
        await queryRunner.query(`ALTER TABLE "user_bans" ADD "banDate" TIMESTAMP WITH TIME ZONE DEFAULT now()`);
        await queryRunner.query(`DROP INDEX "public"."IDX_banned"`);
        await queryRunner.query(`DROP TABLE "user_blogger_bans"`);
    }

}
