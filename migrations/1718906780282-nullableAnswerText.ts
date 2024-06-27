import { MigrationInterface, QueryRunner } from "typeorm";

export class NullableAnswerText1718906780282 implements MigrationInterface {
    name = 'NullableAnswerText1718906780282'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "quiz_answer" ALTER COLUMN "answerText" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "quiz_answer" ALTER COLUMN "answerText" SET NOT NULL`);
    }

}
