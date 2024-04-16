import { BaseFilter } from '../../domain/sorting-base-filter';
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
};

interface CustomFilter extends Partial<BaseFilter> {
  publishedStatus?: publishedStatuses | '';
}

interface CustomOutputFilter {
  publishedStatus: publishedStatuses | '';
}

export const getPagination = <T extends CustomFilter>(
  inputData: T
): PaginationType & CustomOutputFilter => {
  let sortDirection: SortDirections;
  let sortBy: string;

  sortDirection = inputData.sortDirection === 'asc' ? 'ASC' : 'DESC';
  sortBy = inputData.sortBy || 'created_at';

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
  };
};
