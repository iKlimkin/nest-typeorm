import { MigrationInterface, QueryRunner } from "typeorm";

export class AddjustFileMetaTable1722353426346 implements MigrationInterface {
    name = 'AddjustFileMetaTable1722353426346'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "post_images" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "postId" uuid NOT NULL, CONSTRAINT "UQ_92e2382a7f43d4e9350d591fb6a" UNIQUE ("postId"), CONSTRAINT "REL_92e2382a7f43d4e9350d591fb6" UNIQUE ("postId"), CONSTRAINT "PK_32fe67d8cdea0e7536320d7c454" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "blog_images" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "blogId" uuid NOT NULL, CONSTRAINT "UQ_f8170b9ab2fe99c4a8eb1d23751" UNIQUE ("blogId"), CONSTRAINT "REL_f8170b9ab2fe99c4a8eb1d2375" UNIQUE ("blogId"), CONSTRAINT "PK_6d0e82081d480edf74e548575f4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "post" DROP COLUMN "fileMetadatas"`);
        await queryRunner.query(`ALTER TABLE "blog" DROP COLUMN "fileMetadatas"`);
        await queryRunner.query(`ALTER TABLE "file_metadata" ADD "postImagesId" uuid`);
        await queryRunner.query(`ALTER TABLE "file_metadata" ADD "blogImagesId" uuid`);
        await queryRunner.query(`ALTER TABLE "file_metadata" ADD CONSTRAINT "UQ_c34f1f8b1942835cf7ab0313059" UNIQUE ("fileId")`);
        await queryRunner.query(`ALTER TABLE "post_images" ADD CONSTRAINT "FK_92e2382a7f43d4e9350d591fb6a" FOREIGN KEY ("postId") REFERENCES "post"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "file_metadata" ADD CONSTRAINT "FK_45fb2952821e26805e93c2a9d45" FOREIGN KEY ("postImagesId") REFERENCES "post_images"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "file_metadata" ADD CONSTRAINT "FK_1958756dadc92f460cf74186204" FOREIGN KEY ("blogImagesId") REFERENCES "blog_images"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "blog_images" ADD CONSTRAINT "FK_f8170b9ab2fe99c4a8eb1d23751" FOREIGN KEY ("blogId") REFERENCES "blog"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "blog_images" DROP CONSTRAINT "FK_f8170b9ab2fe99c4a8eb1d23751"`);
        await queryRunner.query(`ALTER TABLE "file_metadata" DROP CONSTRAINT "FK_1958756dadc92f460cf74186204"`);
        await queryRunner.query(`ALTER TABLE "file_metadata" DROP CONSTRAINT "FK_45fb2952821e26805e93c2a9d45"`);
        await queryRunner.query(`ALTER TABLE "post_images" DROP CONSTRAINT "FK_92e2382a7f43d4e9350d591fb6a"`);
        await queryRunner.query(`ALTER TABLE "file_metadata" DROP CONSTRAINT "UQ_c34f1f8b1942835cf7ab0313059"`);
        await queryRunner.query(`ALTER TABLE "file_metadata" DROP COLUMN "blogImagesId"`);
        await queryRunner.query(`ALTER TABLE "file_metadata" DROP COLUMN "postImagesId"`);
        await queryRunner.query(`ALTER TABLE "blog" ADD "fileMetadatas" jsonb`);
        await queryRunner.query(`ALTER TABLE "post" ADD "fileMetadatas" jsonb`);
        await queryRunner.query(`DROP TABLE "blog_images"`);
        await queryRunner.query(`DROP TABLE "post_images"`);
    }

}
