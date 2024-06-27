import { IsOptional } from 'class-validator';
import {
  BaseFilter,
  SortDirections,
} from '../../../../../domain/sorting-base-filter';
import {
  ValidateSortBy,
  ValidSortDirection,
} from '../../../../../infra/decorators/transform/transform-params';

export class SAQueryFilter extends BaseFilter {
  pageNumber: string;
  pageSize: string;

  @IsOptional()
  @ValidateSortBy('sa')
  sortBy: string;

  @ValidSortDirection()
  sortDirection: SortDirections;

  searchEmailTerm: string;
  searchLoginTerm: string;
}
