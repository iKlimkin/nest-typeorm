import { Transform, TransformFnParams } from 'class-transformer';
import {
  SortStatFields,
  SortDirectionValues,
  DefaultSortValues,
} from '../../../domain/sorting-base-filter';

const isValidSortingParams = (field, dir) => {
  const validSortField = SortStatFields.includes(field);
  const validSortDirection = SortDirectionValues.includes(dir.toLowerCase());

  return validSortField && validSortDirection;
};
const parseSortingValues = (value) => value.split(' ').map((v) => v.trim());

const parseQuerySortString = (value) => {
  const result = DefaultSortValues;
  if (!value.trim()) return result;

  let [sortField, sortDirection] = parseSortingValues(value);

  if (!sortField || !sortDirection) return result;

  if (isValidSortingParams(sortField, sortDirection)) {
    return [`${sortField} ${sortDirection}`];
  }

  return result;
};
const parseQuerySortArray = (value) =>
  value.filter((param) => {
    if (param.constructor !== String || !param.trim()) return false;

    const [sortField, sortDir] = parseSortingValues(param);
    if (!sortField || !sortDir) return false;

    if (isValidSortingParams(sortField, sortDir)) {
      return [`${sortField} ${sortDir}`];
    }
  });

export const ParseSortParams = () =>
  Transform(({ value }: TransformFnParams) => {
    if (value.constructor === String) {
      return parseQuerySortString(value);
    }

    if (Array.isArray(value)) {
      const parsedQuerySort = parseQuerySortArray(value);
      return parsedQuerySort.length ? parsedQuerySort : DefaultSortValues;
    }

    return DefaultSortValues;
  });
