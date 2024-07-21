import { HttpServer, INestApplication } from '@nestjs/common';
import { SortDirections } from '../../../src/domain/sorting-base-filter';
import { AuthConstantsType, constants } from '../helpers/constants';
import { SortedByFieldType } from './BlogsTestManager';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserAccount } from '../../../src/features/admin/domain/entities/user-account.entity';

export class BaseTestManager {
  protected readonly constants: AuthConstantsType;
  protected readonly application: INestApplication<HttpServer>;
  protected readonly usersRepo: Repository<UserAccount>;
  constructor(
    protected routing: any,
    protected readonly app: INestApplication,
  ) {
    this.constants = constants.auth;
    this.usersRepo = this.app.get(getRepositoryToken(UserAccount));
    this.application = this.app.getHttpServer();
  }
  assertMatch(responseData: any, expectedResult: any) {
    expect(responseData).toEqual(expectedResult);
  }

  isSortedByField = <T>(sortData: SortedByFieldType<T>) => {
    let { field, entities, sortDirection } = sortData;
    let isSorted = true;

    field = field === 'title' ? ('name' as any) : field;

    for (let i = 0; i < entities.length - 1; i++) {
      const currentValue = entities[i][field];
      const nextValue = entities[i + 1][field];

      if (typeof currentValue === 'string' && typeof nextValue === 'string') {
        if (sortDirection.toUpperCase() === SortDirections.ASC) {
          if (currentValue.localeCompare(nextValue) > 0) {
            isSorted = false;
            break;
          }
        } else {
          if (currentValue.localeCompare(nextValue) < 0) {
            isSorted = false;
            break;
          }
        }
      } else if (
        typeof currentValue === 'number' &&
        typeof nextValue === 'number'
      ) {
        if (sortDirection.toUpperCase() === SortDirections.ASC) {
          if (currentValue > nextValue) {
            isSorted = false;
            break;
          }
        } else {
          if (currentValue < nextValue) {
            isSorted = false;
            break;
          }
        }
      } else if (currentValue instanceof Date && nextValue instanceof Date) {
        if (sortDirection.toUpperCase() === SortDirections.ASC) {
          if (currentValue.getTime() > nextValue.getTime()) {
            isSorted = false;
            break;
          }
        } else {
          if (currentValue.getTime() < nextValue.getTime()) {
            isSorted = false;
            break;
          }
        }
      } else {
        throw new Error(
          `Unsupported field type for sorting: ${typeof currentValue}`,
        );
      }
    }

    expect(isSorted).toBe(true);
  };
}
