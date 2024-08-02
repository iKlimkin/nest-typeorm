import { MigrationInterface, QueryRunner } from "typeorm";

export class FileMetaFileIdString1722276450193 implements MigrationInterface {
    name = 'FileMetaFileIdString1722276450193'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "file_metadata" DROP CONSTRAINT "UQ_a186c402647987f9ee1b9cdc9ce"`);
        await queryRunner.query(`ALTER TABLE "file_metadata" DROP COLUMN "fileId"`);
        await queryRunner.query(`ALTER TABLE "file_metadata" ADD "fileId" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "file_metadata" ADD CONSTRAINT "UQ_a186c402647987f9ee1b9cdc9ce" UNIQUE ("fileUrl", "fileId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "file_metadata" DROP CONSTRAINT "UQ_a186c402647987f9ee1b9cdc9ce"`);
        await queryRunner.query(`ALTER TABLE "file_metadata" DROP COLUMN "fileId"`);
        await queryRunner.query(`ALTER TABLE "file_metadata" ADD "fileId" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "file_metadata" ADD CONSTRAINT "UQ_a186c402647987f9ee1b9cdc9ce" UNIQUE ("fileUrl", "fileId")`);
    }

}
