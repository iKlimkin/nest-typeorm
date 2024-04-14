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
import {
  CurrentUserInfo,
  UserSessionDto,
} from '../../../comments/api/controllers';
import { BasicSAAuthGuard } from '../../../auth/infrastructure/guards/basic-auth.guard';
import { CreateQuestionData } from '../models/input.models/create-question.model';
import { InputPublishData } from '../models/input.models/publish-question.model';
import { QuizQuestionsQueryFilter } from '../models/input.models/quiz-questions-query.filter';
import { CreateQuestionCommand } from '../../application/commands/create-question.command';
import { QuestionId } from '../models/output.models.ts/output.types';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { handleErrors } from '../../../../infra/utils/interlay-error-handler.ts/interlay-errors.handler';
import { QuizQueryRepo } from '../models/query-repositories/quiz.query.repo';
import { QuizQuestionViewType } from '../models/view.models.ts/quiz-question.view-type';
import { PaginationViewModelType } from '../../../../domain/pagination-view.model';
import { UpdateQuestionData } from '../models/input.models/update-question.model';
import { UpdateQuestionCommand } from '../../application/commands/update-question.command';

@UseGuards(BasicSAAuthGuard)
@Controller('sa/quiz/questions')
export class QuizQuestionsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly quizQueryRepo: QuizQueryRepo
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getQuestions(
    @Query() query: QuizQuestionsQueryFilter
  ): Promise<PaginationViewModelType<QuizQuestionViewType>> {
    const foundQuestions = await this.quizQueryRepo.getQuizQuestions(query);
    return foundQuestions;
  }

  @Post()
  async createQuestion(
    @Body() body: CreateQuestionData
  ): Promise<QuizQuestionViewType> {
    const command = new CreateQuestionCommand(body);
    const result = await this.commandBus.execute<
      CreateQuestionCommand,
      LayerNoticeInterceptor<QuestionId | null>
    >(command);

    if (result.hasError()) {
      const errors = handleErrors(result.code, result.extensions[0]);
      throw errors.error;
    }

    const foundQuizQuestion = await this.quizQueryRepo.getQuizQuestion(
      result.data.questionId
    );

    return foundQuizQuestion;
  }

  @Delete(':id')
  async deleteQuestion(@Param('id') questionId: string) {}

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateQuestion(
    @Param('id') questionId: string,
    @Body() body: UpdateQuestionData
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

    if (result.hasError()) {
      const errors = handleErrors(result.code, result.extensions[0]);
      throw errors.error;
    }
  }

  @Put(':id/publish')
  async publishQuestion(
    @Param('id') questionId: string,
    @Body() body: InputPublishData
  ) {}
}
