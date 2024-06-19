import { applyDecorators } from '@nestjs/common';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import {
  DefaultSortValues,
  SortByType,
  SortDirectionValues,
  SortDirections,
  SortStatFields,
  convertSortBy,
  sortingConstraints,
} from '../../../domain/sorting-base-filter';
import {
  convertPublishedStatus,
  publishedStatuses,
} from '../../../features/quiz/api/models/input.models/statuses.model';

export const iSValidField = ({ min, max }, regexOption?: RegExp) => {
  const decorators = [
    Length(min, max, { message: `range of values [${min}, ${max}] ` }),
    IsNotEmpty(),
    Trim(),
    IsString(),
  ];

  if (regexOption) {
    decorators.unshift(
      Matches(regexOption, { message: "field doesn't match" }),
    );
  }

  return applyDecorators(...decorators);
};

const isValidSortingParams = (field, dir) => {
  const validSortField = SortStatFields.includes(field);
  const validSortDirection = SortDirectionValues.includes(dir.toLowerCase());

  return validSortField && validSortDirection;
};
const parseSortingValues = (value) => value.split(' ').map((v) => v.trim());

export const ParseSortParams = () =>
  Transform(({ value }: TransformFnParams) => {
    if (value.constructor === String) {
      const result = DefaultSortValues;
      if (!value.trim()) return result;

      let [sortField, sortDirection] = parseSortingValues(value);

      if (!sortField || !sortDirection) return result;

      if (isValidSortingParams(sortField, sortDirection)) {
        return [`${sortField} ${sortDirection}`];
      }

      return result;
    }

    const parsedQuerySort = value.filter((param) => {
      if (param.constructor !== String || !param.trim()) return false;

      const [sortField, sortDir] = parseSortingValues(param);
      if (!sortField || !sortDir) return false;

      if (isValidSortingParams(sortField, sortDir)) {
        return [`${sortField} ${sortDir}`];
      }
    });

    return parsedQuerySort.length ? parsedQuerySort : DefaultSortValues;
  });

export const Trim = () =>
  Transform(({ value }: TransformFnParams) => value?.trim());

export const ValidateSortBy = (entity: SortByType = 'default') =>
  Transform(({ value }: TransformFnParams) => {
    const isValidValue = sortingConstraints[entity].includes(value);

    return !isValidValue ? convertSortBy.createdAt : convertSortBy[value];
  });

export const ValidSortDirection = () =>
  Transform(({ value }: TransformFnParams): SortDirections => {
    const values = Object.values(SortDirections);
    const lowerValue = value.toLowerCase();

    return !value || !values.includes(lowerValue)
      ? SortDirections.Desc
      : lowerValue;
  });

export const ValidateAndConvertStatuses = () =>
  Transform(({ value }: TransformFnParams) => {
    const isValidStatus = publishedStatuses[value];

    return !isValidStatus
      ? convertPublishedStatus.all
      : convertPublishedStatus[value];
  });
