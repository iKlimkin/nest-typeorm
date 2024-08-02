// import { MigrationInterface, QueryRunner } from "typeorm";

// export class AdjustFileMetadata1722346334043 implements MigrationInterface {
//     name = 'AdjustFileMetadata1722346334043'

//     public async up(queryRunner: QueryRunner): Promise<void> {
//         await queryRunner.query(`ALTER TABLE "file_metadata" DROP CONSTRAINT "UQ_a186c402647987f9ee1b9cdc9ce"`);
//         await queryRunner.query(`ALTER TABLE "post" DROP COLUMN "fileMetadatas"`);
//         await queryRunner.query(`ALTER TABLE "blog" DROP COLUMN "fileMetadatas"`);
//         await queryRunner.query(`ALTER TABLE "file_metadata" ADD "entityId" character varying NOT NULL`);
//         await queryRunner.query(`ALTER TABLE "file_metadata" ADD "entityType" character varying NOT NULL`);
//         await queryRunner.query(`ALTER TABLE "file_metadata" ADD CONSTRAINT "UQ_c34f1f8b1942835cf7ab0313059" UNIQUE ("fileId")`);
//     }

//     public async down(queryRunner: QueryRunner): Promise<void> {
//         await queryRunner.query(`ALTER TABLE "file_metadata" DROP CONSTRAINT "UQ_c34f1f8b1942835cf7ab0313059"`);
//         await queryRunner.query(`ALTER TABLE "file_metadata" DROP COLUMN "entityType"`);
//         await queryRunner.query(`ALTER TABLE "file_metadata" DROP COLUMN "entityId"`);
//         await queryRunner.query(`ALTER TABLE "blog" ADD "fileMetadatas" jsonb`);
//         await queryRunner.query(`ALTER TABLE "post" ADD "fileMetadatas" jsonb`);
//         await queryRunner.query(`ALTER TABLE "file_metadata" ADD CONSTRAINT "UQ_a186c402647987f9ee1b9cdc9ce" UNIQUE ("fileUrl", "fileId")`);
//     }

// }
