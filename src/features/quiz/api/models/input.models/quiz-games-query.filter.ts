import { IsOptional } from 'class-validator';
import {
  BaseFilter,
  SortDirections,
} from '../../../../../domain/sorting-base-filter';
import {
  ValidSortDirection,
  ValidateSortBy,
} from '../../../../../infra/decorators/transform/is-valid-field';

export class QuizGamesQueryFilter extends BaseFilter {
  @IsOptional()
  @ValidateSortBy('quizGames')
  sortBy: string;

  @IsOptional()
  @ValidSortDirection()
  sortDirection: SortDirections;

  pageNumber: string;
  pageSize: string;
}
