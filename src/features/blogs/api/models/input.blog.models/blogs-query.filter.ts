import {
  BaseFilter,
  SortDirections,
} from '../../../../../domain/sorting-base-filter';
import {
  ValidateSortBy,
  ValidSortDirection,
} from '../../../../../infra/decorators/transform/transform-params';

export class BlogsQueryFilter extends BaseFilter {
  pageNumber: string;
  pageSize: string;

  @ValidateSortBy('blogs')
  sortBy: string;

  @ValidSortDirection()
  sortDirection: SortDirections;
  searchNameTerm: string;
}
