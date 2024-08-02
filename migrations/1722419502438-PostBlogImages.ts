import { MigrationInterface, QueryRunner } from "typeorm";

export class PostBlogImages1722419502438 implements MigrationInterface {
    name = 'PostBlogImages1722419502438'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "file_metadata" DROP CONSTRAINT "FK_1958756dadc92f460cf74186204"`);
        await queryRunner.query(`ALTER TABLE "file_metadata" DROP CONSTRAINT "FK_45fb2952821e26805e93c2a9d45"`);
        await queryRunner.query(`ALTER TABLE "file_metadata" DROP COLUMN "postImagesId"`);
        await queryRunner.query(`ALTER TABLE "file_metadata" DROP COLUMN "blogImagesId"`);
        await queryRunner.query(`ALTER TABLE "file_metadata" DROP COLUMN "blogId"`);
        await queryRunner.query(`ALTER TABLE "file_metadata" DROP COLUMN "postId"`);
        await queryRunner.query(`ALTER TABLE "file_metadata" ADD "postImageId" uuid`);
        await queryRunner.query(`ALTER TABLE "file_metadata" ADD "blogImageId" uuid`);
        await queryRunner.query(`ALTER TABLE "file_metadata" ADD CONSTRAINT "FK_ff681d0f9b25db3117f18465cd2" FOREIGN KEY ("postImageId") REFERENCES "post_images"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "file_metadata" ADD CONSTRAINT "FK_c2f4c6729925f4b2ca3f0948bc5" FOREIGN KEY ("blogImageId") REFERENCES "blog_images"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "file_metadata" DROP CONSTRAINT "FK_c2f4c6729925f4b2ca3f0948bc5"`);
        await queryRunner.query(`ALTER TABLE "file_metadata" DROP CONSTRAINT "FK_ff681d0f9b25db3117f18465cd2"`);
        await queryRunner.query(`ALTER TABLE "file_metadata" DROP COLUMN "blogImageId"`);
        await queryRunner.query(`ALTER TABLE "file_metadata" DROP COLUMN "postImageId"`);
        await queryRunner.query(`ALTER TABLE "file_metadata" ADD "postId" character varying`);
        await queryRunner.query(`ALTER TABLE "file_metadata" ADD "blogId" character varying`);
        await queryRunner.query(`ALTER TABLE "file_metadata" ADD "blogImagesId" uuid`);
        await queryRunner.query(`ALTER TABLE "file_metadata" ADD "postImagesId" uuid`);
        await queryRunner.query(`ALTER TABLE "file_metadata" ADD CONSTRAINT "FK_45fb2952821e26805e93c2a9d45" FOREIGN KEY ("postImagesId") REFERENCES "post_images"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "file_metadata" ADD CONSTRAINT "FK_1958756dadc92f460cf74186204" FOREIGN KEY ("blogImagesId") REFERENCES "blog_images"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
