import { IsOptional } from 'class-validator';
import {
  BaseFilter,
  SortDirections,
} from '../../../../../domain/sorting-base-filter';
import {
  ValidateSortBy,
  ValidSortDirection,
} from '../../../../../infra/decorators/transform/transform-params';

export class CommentsQueryFilter extends BaseFilter {
  pageNumber: string;
  pageSize: string;

  @ValidateSortBy('comments')
  sortBy: string;

  @ValidSortDirection()
  sortDirection: SortDirections;
  @IsOptional()
  searchContentTerm: string;
}
