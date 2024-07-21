import { IsOptional } from 'class-validator';
import {
  BaseFilter,
  SortDirections,
} from '../../../../../domain/sorting-base-filter';
import {
  ValidateSortBy,
  ValidSortDirection,
} from '../../../../../infra/decorators/transform/transform-params';

export class BloggerBannedUsersQueryFilter extends BaseFilter {
  pageNumber: string;
  pageSize: string;

  @IsOptional()
  @ValidateSortBy()
  sortBy: string;

  @ValidSortDirection()
  sortDirection: SortDirections;

  searchLoginTerm: string;
}
