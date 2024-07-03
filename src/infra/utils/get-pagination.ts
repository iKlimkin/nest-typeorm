import {
  BaseFilter,
  DefaultSortValues,
} from '../../domain/sorting-base-filter';
import { publishedStatuses } from '../../features/quiz/api/models/input.models/statuses.model';

enum sortDirections {
  ASC = 'ASC',
  DESC = 'DESC',
}

type SortDirections = keyof typeof sortDirections;

export type PaginationType = {
  pageNumber: number;
  pageSize: number;
  skip: number;
  sortBy: string;
  sortDirection: SortDirections;
  sort?: string[];
};

interface CustomFilter extends Partial<BaseFilter> {
  publishedStatus?: publishedStatuses | '';
  sort?: string[];
}

interface CustomOutputFilter {
  publishedStatus: publishedStatuses | '';
  sort?: string[];
}

export const getPagination = <T extends CustomFilter>(
  inputData: T,
): PaginationType & CustomOutputFilter => {
  let sortDirection: SortDirections;
  let sortBy: string;
  let sort: string[];

  sortDirection = inputData.sortDirection === 'asc' ? 'ASC' : 'DESC';
  sortBy = inputData.sortBy || 'created_at';
  sort = inputData.sort || DefaultSortValues;

  const parsedPageNumber = parseInt(inputData.pageNumber, 10);
  const pageNumber = !isNaN(parsedPageNumber)
    ? Math.min(parsedPageNumber, 50)
    : 1;

  const parsedPageSize = parseInt(inputData.pageSize, 10);
  const pageSize = !isNaN(parsedPageSize) ? Math.min(parsedPageSize, 50) : 10;

  const skip = (pageNumber - 1) * pageSize;

  const publishedStatus = inputData.publishedStatus || '';

  return {
    pageNumber,
    pageSize,
    skip,
    sortBy,
    sortDirection,
    publishedStatus,
    sort,
  };
};
