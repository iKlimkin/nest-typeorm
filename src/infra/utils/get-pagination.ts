import { SortDirection } from 'typeorm';
import { BaseFilter, convertSortBy } from '../../domain/sorting-base-filter';

enum sortDirections {
  ASC = 'ASC',
  DESC = 'DESC',
}

type SortDirectionsType = keyof typeof sortDirections;

export type PaginationType = {
  sort: Record<string, SortDirection>;
  pageNumber: number;
  pageSize: number;
  skip: number;
  sortBy: string;
  sortDirection: SortDirectionsType;
};

export type SortOptions = {
  sortDirection: string;
  sortBy: string;
};

type SortDirections = SortDirection | SortDirectionsType;

export const getPagination = (
  inputData: BaseFilter,
  userAccountOptions?: boolean,
  sqlOptions: boolean = false,
): PaginationType => {
  let sortDirection: SortDirections;
  let sortBy: string;

  if (sqlOptions) {
    sortDirection = inputData.sortDirection === 'asc' ? 'ASC' : 'DESC';
    sortBy = inputData.sortBy || 'created_at';
  } else {
    sortDirection = inputData.sortDirection === 'asc' ? 1 : -1;
    sortBy = inputData.sortBy || 'createdAt';
  }

  const parsedPageNumber = parseInt(inputData.pageNumber, 10);
  const pageNumber = !isNaN(parsedPageNumber)
    ? Math.min(parsedPageNumber, 50)
    : 1;

  const parsedPageSize = parseInt(inputData.pageSize, 10);
  const pageSize = !isNaN(parsedPageSize) ? Math.min(parsedPageSize, 50) : 10;

  const skip: number = (pageNumber - 1) * pageSize;

  const getDefaultSort = (sortBy: string): Record<string, SortDirection> => ({
    [sortBy]: sortDirection as SortDirection,
  });

  const getUserAccountSort = (
    sortBy: string,
  ): Record<string, SortDirection> => {
    const sortingKeyMap: Record<string, string> = {
      login: 'accountData.login',
      email: 'accountData.email',
    };

    const sortingKey: string = sortingKeyMap[sortBy] || `accountData.createdAt`;

    return {
      [sortingKey]: sortDirection as SortDirection,
    };
  };

  const sort: Record<string, SortDirection> = userAccountOptions
    ? getUserAccountSort(sortBy)
    : getDefaultSort(sortBy);

  return {
    sort,
    pageNumber,
    pageSize,
    skip,
    sortBy,
    sortDirection: sortDirection as SortDirectionsType,
  };
};
