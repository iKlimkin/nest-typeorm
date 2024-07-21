import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCascadeDeleteUserSession1721225660116 implements MigrationInterface {
    name = 'AddCascadeDeleteUserSession1721225660116'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_session" DROP CONSTRAINT "FK_13275383dcdf095ee29f2b3455a"`);
        await queryRunner.query(`ALTER TABLE "user_session" ADD CONSTRAINT "FK_13275383dcdf095ee29f2b3455a" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_session" DROP CONSTRAINT "FK_13275383dcdf095ee29f2b3455a"`);
        await queryRunner.query(`ALTER TABLE "user_session" ADD CONSTRAINT "FK_13275383dcdf095ee29f2b3455a" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
