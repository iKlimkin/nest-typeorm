import { MigrationInterface, QueryRunner } from "typeorm";

export class PostBlogImages1722437624428 implements MigrationInterface {
    name = 'PostBlogImages1722437624428'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "file_metadata" DROP CONSTRAINT "FK_c2f4c6729925f4b2ca3f0948bc5"`);
        await queryRunner.query(`ALTER TABLE "file_metadata" DROP COLUMN "blogImageId"`);
        await queryRunner.query(`ALTER TABLE "post_image" DROP CONSTRAINT "UQ_668c9fb892f2accb872670c7b1e"`);
        await queryRunner.query(`ALTER TABLE "post_image" DROP COLUMN "postId"`);
        await queryRunner.query(`ALTER TABLE "post_image" ADD "postId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "post_image" ADD CONSTRAINT "UQ_668c9fb892f2accb872670c7b1e" UNIQUE ("postId")`);
        await queryRunner.query(`ALTER TABLE "file_metadata" DROP CONSTRAINT "UQ_c34f1f8b1942835cf7ab0313059"`);
        await queryRunner.query(`ALTER TABLE "file_metadata" DROP COLUMN "blogImgId"`);
        await queryRunner.query(`ALTER TABLE "file_metadata" ADD "blogImgId" uuid`);
        await queryRunner.query(`ALTER TABLE "post_image" ADD CONSTRAINT "FK_668c9fb892f2accb872670c7b1e" FOREIGN KEY ("postId") REFERENCES "post"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "file_metadata" ADD CONSTRAINT "FK_bdfe9199f8c43a5b9109d0c5567" FOREIGN KEY ("blogImgId") REFERENCES "blog_image"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "file_metadata" DROP CONSTRAINT "FK_bdfe9199f8c43a5b9109d0c5567"`);
        await queryRunner.query(`ALTER TABLE "post_image" DROP CONSTRAINT "FK_668c9fb892f2accb872670c7b1e"`);
        await queryRunner.query(`ALTER TABLE "file_metadata" DROP COLUMN "blogImgId"`);
        await queryRunner.query(`ALTER TABLE "file_metadata" ADD "blogImgId" character varying`);
        await queryRunner.query(`ALTER TABLE "file_metadata" ADD CONSTRAINT "UQ_c34f1f8b1942835cf7ab0313059" UNIQUE ("fileId")`);
        await queryRunner.query(`ALTER TABLE "post_image" DROP CONSTRAINT "UQ_668c9fb892f2accb872670c7b1e"`);
        await queryRunner.query(`ALTER TABLE "post_image" DROP COLUMN "postId"`);
        await queryRunner.query(`ALTER TABLE "post_image" ADD "postId" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "post_image" ADD CONSTRAINT "UQ_668c9fb892f2accb872670c7b1e" UNIQUE ("postId")`);
        await queryRunner.query(`ALTER TABLE "file_metadata" ADD "blogImageId" uuid`);
        await queryRunner.query(`ALTER TABLE "file_metadata" ADD CONSTRAINT "FK_c2f4c6729925f4b2ca3f0948bc5" FOREIGN KEY ("blogImageId") REFERENCES "blog_image"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
