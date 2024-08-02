import { MigrationInterface, QueryRunner } from "typeorm";

export class PostBlogImages1722422575701 implements MigrationInterface {
    name = 'PostBlogImages1722422575701'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "file_metadata" DROP CONSTRAINT "FK_c2f4c6729925f4b2ca3f0948bc5"`);
        await queryRunner.query(`ALTER TABLE "file_metadata" DROP CONSTRAINT "FK_ff681d0f9b25db3117f18465cd2"`);
        await queryRunner.query(`CREATE TABLE "post_image" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "postId" character varying NOT NULL, CONSTRAINT "UQ_668c9fb892f2accb872670c7b1e" UNIQUE ("postId"), CONSTRAINT "PK_0c74d0ac8869bc3a3cbaa3ec55d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "blog_image" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "blogId" character varying NOT NULL, CONSTRAINT "UQ_ce8d6380d907e85a4216d89d409" UNIQUE ("blogId"), CONSTRAINT "PK_05924474be158e58458d7bd4665" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "file_metadata" DROP COLUMN "postImageId"`);
        await queryRunner.query(`ALTER TABLE "file_metadata" ADD "postImgId" uuid`);
        await queryRunner.query(`ALTER TABLE "file_metadata" ADD "blogImgId" character varying`);
        await queryRunner.query(`ALTER TABLE "file_metadata" ADD CONSTRAINT "FK_c99ea0535dbad118d78ea8482bc" FOREIGN KEY ("postImgId") REFERENCES "post_image"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "file_metadata" ADD CONSTRAINT "FK_c2f4c6729925f4b2ca3f0948bc5" FOREIGN KEY ("blogImageId") REFERENCES "blog_image"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "file_metadata" DROP CONSTRAINT "FK_c2f4c6729925f4b2ca3f0948bc5"`);
        await queryRunner.query(`ALTER TABLE "file_metadata" DROP CONSTRAINT "FK_c99ea0535dbad118d78ea8482bc"`);
        await queryRunner.query(`ALTER TABLE "file_metadata" DROP COLUMN "blogImgId"`);
        await queryRunner.query(`ALTER TABLE "file_metadata" DROP COLUMN "postImgId"`);
        await queryRunner.query(`ALTER TABLE "file_metadata" ADD "postImageId" uuid`);
        await queryRunner.query(`DROP TABLE "blog_image"`);
        await queryRunner.query(`DROP TABLE "post_image"`);
        await queryRunner.query(`ALTER TABLE "file_metadata" ADD CONSTRAINT "FK_ff681d0f9b25db3117f18465cd2" FOREIGN KEY ("postImageId") REFERENCES "post_images"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "file_metadata" ADD CONSTRAINT "FK_c2f4c6729925f4b2ca3f0948bc5" FOREIGN KEY ("blogImageId") REFERENCES "blog_images"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
