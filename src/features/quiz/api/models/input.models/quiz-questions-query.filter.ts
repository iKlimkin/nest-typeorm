import { IsEnum, IsOptional } from 'class-validator';
import {
  BaseFilter,
  SortDirections,
} from '../../../../../domain/sorting-base-filter';
import {
  ValidSortDirection,
  ValidateSortBy,
} from '../../../../../infra/decorators/transform/is-valid-string';

enum publishedStatuses {
  all = 'all',
  published = 'published',
  unpublished = 'unpublished',
}

export class QuizQuestionsQueryFilter extends BaseFilter {
  @IsOptional()
  bodySearchTerm: string;

  @IsOptional()
  @IsEnum(publishedStatuses)
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
