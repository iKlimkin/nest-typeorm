import { BaseFilter } from '../../domain/sorting-base-filter';

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

export const getPagination = (inputData: BaseFilter): PaginationType => {
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

  return {
    pageNumber,
    pageSize,
    skip,
    sortBy,
    sortDirection,
  };
};
