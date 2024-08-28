import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { RouterPaths } from '../../../../infra/utils/routing';
import { PaginationViewModelType } from '../../../../domain/pagination-view.model';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { handleErrors } from '../../../../infra/utils/interlay-error-handler.ts/interlay-errors.handler';
import { BasicSAAuthGuard } from '../../../auth/infrastructure/guards/basic-auth.guard';
import { CreateQuestionCommand } from '../../application/commands/create-question.command';
import { DeleteQuestionCommand } from '../../application/commands/delete-question.command';
import { PublishQuestionCommand } from '../../application/commands/publish-question.command';
import { UpdateQuestionCommand } from '../../application/commands/update-question.command';
import { CreateQuestionData } from '../models/input.models/create-question.model';
import { InputPublishData } from '../models/input.models/publish-question.model';
import { QuizQuestionsQueryFilter } from '../models/input.models/quiz-questions-query.filter';
import { UpdateQuestionData } from '../models/input.models/update-question.model';
import { QuestionId } from '../models/output.models.ts/output.types';
import { QuizQuestionViewType } from '../models/output.models.ts/view.models.ts/quiz-question.view-type';
import { QuizQueryRepo } from '../models/query-repositories/quiz.query.repo';

@UseGuards(BasicSAAuthGuard)
@Controller(RouterPaths.quizQuestions)
export class QuizQuestionsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly quizQueryRepo: QuizQueryRepo,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getQuestions(
    @Query() query: QuizQuestionsQueryFilter,
  ): Promise<PaginationViewModelType<QuizQuestionViewType>> {
    return this.quizQueryRepo.getQuizQuestions(query);
  }

  @Post()
  async createQuestion(
    @Body() body: CreateQuestionData,
  ): Promise<QuizQuestionViewType> {
    const command = new CreateQuestionCommand(body);
    const createdQuestionResult = await this.commandBus.execute<
      CreateQuestionCommand,
      LayerNoticeInterceptor<QuestionId | null>
    >(command);

    if (createdQuestionResult.hasError) {
      const errors = handleErrors(
        createdQuestionResult.code,
        createdQuestionResult.extensions[0],
      );
      throw errors.error;
    }

    return this.quizQueryRepo.getQuizQuestion(
      createdQuestionResult.data.questionId,
    );
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateQuestion(
    @Param('id') questionId: string,
    @Body() body: UpdateQuestionData,
  ) {
    const question = await this.quizQueryRepo.getQuizQuestion(questionId);

    if (!question) throw new NotFoundException();

    const command = new UpdateQuestionCommand({
      ...body,
      published: question.published,
      questionId,
    });

    const result = await this.commandBus.execute<
      UpdateQuestionCommand,
      LayerNoticeInterceptor<boolean>
    >(command);

    if (result.hasError) {
      const errors = handleErrors(result.code, result.extensions[0]);
      throw errors.error;
    }
  }

  @Put(':id/publish')
  @HttpCode(HttpStatus.NO_CONTENT)
  async publishQuestion(
    @Param('id') questionId: string,
    @Body() body: InputPublishData,
  ) {
    const question = await this.quizQueryRepo.getQuizQuestion(questionId);

    if (!question) throw new NotFoundException();

    if (!body.published || question.published) throw new BadRequestException();

    const command = new PublishQuestionCommand(questionId);

    const result = await this.commandBus.execute(command);

    if (result.hasError) {
      const errors = handleErrors(result.code, result.extensions[0]);
      throw errors.error;
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteQuestion(@Param('id') questionId: string) {
    const question = await this.quizQueryRepo.getQuizQuestion(questionId);

    if (!question) throw new NotFoundException();

    const command = new DeleteQuestionCommand(questionId);

    const result = await this.commandBus.execute<
      DeleteQuestionCommand,
      LayerNoticeInterceptor<boolean>
    >(command);

    if (result.hasError) {
      const errors = handleErrors(result.code, result.extensions[0]);
      throw errors.error;
    }
  }
}
