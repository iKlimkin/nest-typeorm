import { IsOptional } from 'class-validator';
import {
  BaseFilter,
  SortDirections,
  sortingConstraints,
} from '../../../../../domain/sorting-base-filter';
import {
  ValidSortDirection,
  ValidateSortBy,
} from '../../../../../infra/decorators/transform/transform-params';
import { ParseSortParams } from '../../../../../infra/decorators/transform/parse-sort-params';

type QuizGamesSortBy = (typeof sortingConstraints.quizGames)[number];

export class QuizGamesQueryFilter extends BaseFilter {
  @IsOptional()
  @ValidateSortBy('quizGames')
  sortBy: QuizGamesSortBy;

  @IsOptional()
  @ValidSortDirection()
  sortDirection: SortDirections;

  pageNumber: string;
  pageSize: string;
}

export class StatsQueryFilter {
  @IsOptional()
  @ParseSortParams()
  sort: string[];

  @IsOptional()
  pageNumber: string;

  @IsOptional()
  pageSize: string;
}
