import { applyDecorators } from '@nestjs/common';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import {
  SortByType,
  SortDirections,
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

    return value && values.includes(lowerValue)
      ? lowerValue
      : SortDirections.Desc;
  });

export const ValidateAndConvertStatuses = () =>
  Transform(({ value }: TransformFnParams) => {
    const isValidStatus = publishedStatuses[value];

    return !isValidStatus
      ? convertPublishedStatus.all
      : convertPublishedStatus[value];
  });
