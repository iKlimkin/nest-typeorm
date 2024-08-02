import { MigrationInterface, QueryRunner } from "typeorm";

export class AdjustTableImagesMetadata1722332881618 implements MigrationInterface {
    name = 'AdjustTableImagesMetadata1722332881618'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "file_metadata" DROP CONSTRAINT "FK_a1ed83db58bf0e31915fa6c80d2"`);
        await queryRunner.query(`ALTER TABLE "file_metadata" DROP CONSTRAINT "FK_cfe61ff4fbc5cb04eab88eb3785"`);
        await queryRunner.query(`ALTER TABLE "file_metadata" DROP COLUMN "blogId"`);
        await queryRunner.query(`ALTER TABLE "file_metadata" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "file_metadata" DROP COLUMN "entityType"`);
        await queryRunner.query(`ALTER TABLE "post" ADD "fileMetadatas" jsonb`);
        await queryRunner.query(`ALTER TABLE "blog" ADD "fileMetadatas" jsonb`);
        await queryRunner.query(`ALTER TABLE "file_metadata" DROP CONSTRAINT "UQ_a186c402647987f9ee1b9cdc9ce"`);
        await queryRunner.query(`ALTER TABLE "file_metadata" DROP COLUMN "fileId"`);
        await queryRunner.query(`ALTER TABLE "file_metadata" ADD "fileId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "file_metadata" ADD CONSTRAINT "UQ_a186c402647987f9ee1b9cdc9ce" UNIQUE ("fileUrl", "fileId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "file_metadata" DROP CONSTRAINT "UQ_a186c402647987f9ee1b9cdc9ce"`);
        await queryRunner.query(`ALTER TABLE "file_metadata" DROP COLUMN "fileId"`);
        await queryRunner.query(`ALTER TABLE "file_metadata" ADD "fileId" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "file_metadata" ADD CONSTRAINT "UQ_a186c402647987f9ee1b9cdc9ce" UNIQUE ("fileUrl", "fileId")`);
        await queryRunner.query(`ALTER TABLE "blog" DROP COLUMN "fileMetadatas"`);
        await queryRunner.query(`ALTER TABLE "post" DROP COLUMN "fileMetadatas"`);
        await queryRunner.query(`ALTER TABLE "file_metadata" ADD "entityType" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "file_metadata" ADD "userId" uuid`);
        await queryRunner.query(`ALTER TABLE "file_metadata" ADD "blogId" uuid`);
        await queryRunner.query(`ALTER TABLE "file_metadata" ADD CONSTRAINT "FK_cfe61ff4fbc5cb04eab88eb3785" FOREIGN KEY ("blogId") REFERENCES "blog"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "file_metadata" ADD CONSTRAINT "FK_a1ed83db58bf0e31915fa6c80d2" FOREIGN KEY ("userId") REFERENCES "user_account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
