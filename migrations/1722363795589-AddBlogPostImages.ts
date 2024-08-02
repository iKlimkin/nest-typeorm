import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBlogPostImages1722363795589 implements MigrationInterface {
    name = 'AddBlogPostImages1722363795589'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "post_images" DROP CONSTRAINT "FK_92e2382a7f43d4e9350d591fb6a"`);
        await queryRunner.query(`ALTER TABLE "blog_images" DROP CONSTRAINT "FK_f8170b9ab2fe99c4a8eb1d23751"`);
        await queryRunner.query(`ALTER TABLE "file_metadata" DROP CONSTRAINT "UQ_a186c402647987f9ee1b9cdc9ce"`);
        await queryRunner.query(`ALTER TABLE "post_images" DROP CONSTRAINT "UQ_92e2382a7f43d4e9350d591fb6a"`);
        await queryRunner.query(`ALTER TABLE "post_images" DROP COLUMN "postId"`);
        await queryRunner.query(`ALTER TABLE "post_images" ADD "postId" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "post_images" ADD CONSTRAINT "UQ_92e2382a7f43d4e9350d591fb6a" UNIQUE ("postId")`);
        await queryRunner.query(`ALTER TABLE "blog_images" DROP CONSTRAINT "UQ_f8170b9ab2fe99c4a8eb1d23751"`);
        await queryRunner.query(`ALTER TABLE "blog_images" DROP COLUMN "blogId"`);
        await queryRunner.query(`ALTER TABLE "blog_images" ADD "blogId" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "blog_images" ADD CONSTRAINT "UQ_f8170b9ab2fe99c4a8eb1d23751" UNIQUE ("blogId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "blog_images" DROP CONSTRAINT "UQ_f8170b9ab2fe99c4a8eb1d23751"`);
        await queryRunner.query(`ALTER TABLE "blog_images" DROP COLUMN "blogId"`);
        await queryRunner.query(`ALTER TABLE "blog_images" ADD "blogId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "blog_images" ADD CONSTRAINT "UQ_f8170b9ab2fe99c4a8eb1d23751" UNIQUE ("blogId")`);
        await queryRunner.query(`ALTER TABLE "post_images" DROP CONSTRAINT "UQ_92e2382a7f43d4e9350d591fb6a"`);
        await queryRunner.query(`ALTER TABLE "post_images" DROP COLUMN "postId"`);
        await queryRunner.query(`ALTER TABLE "post_images" ADD "postId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "post_images" ADD CONSTRAINT "UQ_92e2382a7f43d4e9350d591fb6a" UNIQUE ("postId")`);
        await queryRunner.query(`ALTER TABLE "file_metadata" ADD CONSTRAINT "UQ_a186c402647987f9ee1b9cdc9ce" UNIQUE ("fileUrl", "fileId")`);
        await queryRunner.query(`ALTER TABLE "blog_images" ADD CONSTRAINT "FK_f8170b9ab2fe99c4a8eb1d23751" FOREIGN KEY ("blogId") REFERENCES "blog"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "post_images" ADD CONSTRAINT "FK_92e2382a7f43d4e9350d591fb6a" FOREIGN KEY ("postId") REFERENCES "post"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
