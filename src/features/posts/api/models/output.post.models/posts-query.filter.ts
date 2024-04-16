import { IsOptional } from 'class-validator';
import {
  BaseFilter,
  SortDirections,
} from '../../../../../domain/sorting-base-filter';
import {
  ValidateSortBy,
  ValidSortDirection,
} from '../../../../../infra/decorators/transform/is-valid-field';

export class PostsQueryFilter extends BaseFilter {
  pageNumber: string;
  pageSize: string;
  @ValidateSortBy('posts')
  sortBy: string;

  @ValidSortDirection()
  sortDirection: SortDirections;
  @IsOptional()
  searchContentTerm: string;
}
