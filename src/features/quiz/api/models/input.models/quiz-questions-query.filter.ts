import { IsEnum, IsOptional } from 'class-validator';
import {
  BaseFilter,
  SortDirections,
} from '../../../../../domain/sorting-base-filter';
import {
  ValidSortDirection,
  ValidateAndConvertStatuses,
  ValidateSortBy,
} from '../../../../../infra/decorators/transform/is-valid-field';
import { publishedStatuses } from './statuses.model';

export class QuizQuestionsQueryFilter extends BaseFilter {
  @IsOptional()
  bodySearchTerm: string;

  @IsOptional()
  @ValidateAndConvertStatuses()
  // @IsEnum(publishedStatuses)
  publishedStatus: publishedStatuses;

  @IsOptional()
  @ValidateSortBy('quizQuestions')
  sortBy: string;

  @IsOptional()
  @ValidSortDirection()
  sortDirection: SortDirections;

  pageNumber: string;
  pageSize: string;
}
