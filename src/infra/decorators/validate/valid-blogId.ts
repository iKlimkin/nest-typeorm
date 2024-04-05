import { Injectable } from '@nestjs/common';
import {
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
} from 'class-validator';
import { BlogsQueryRepo } from '../../../features/blogs/api/query-repositories/blogs.query.repo';
import { BlogsSqlQueryRepo } from '../../../features/blogs/api/query-repositories/blogs.query.sql-repo';

@ValidatorConstraint({ name: 'BlogIdIsExist', async: true })
@Injectable()
export class BlogIdExistConstraint implements ValidatorConstraintInterface {
  constructor(private readonly blogsQueryRepo: BlogsQueryRepo,
    private readonly blogsSqlQueryRepo: BlogsSqlQueryRepo) {}

  async validate(value: any, args: ValidationArguments) {
    const existBlogInMongo = await this.blogsQueryRepo.getBlogById(value);
    const existBlogInSql = await this.blogsSqlQueryRepo.getBlogById(value);
    return existBlogInMongo || existBlogInSql ? true : false;
  }

  defaultMessage(validationArguments?: ValidationArguments | undefined) {
    return `${validationArguments?.constraints}`;
  }
}

export function BlogIdIsExist(
  property?: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [property],
      validator: BlogIdExistConstraint,
    });
  };
}
