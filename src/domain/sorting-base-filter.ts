import { IsOptional, IsString } from 'class-validator';
import { SortDirection } from 'typeorm';

export enum convertSortBy {
  id = 'id',
  userId = 'user_id',
  blogId = 'blogId',
  postId = 'post_id',
  commentId = 'comment_id',
  blogName = 'blogTitle',
  content = 'content',
  title = 'title',
  name = 'title',
  description = 'description',
  shortDescription = 'shortDescription',
  websiteUrl = 'websiteUrl',
  startGameDate = '"startGameDate"',
  finishGameDate = '"finishGameDate"',
  pairCreatedDate = 'created_at',
  createdAt = 'created_at',
  created_at = 'created_at',
  isMembership = 'isMembership',
  email = 'email',
  login = 'login',
  userLogin = 'userLogin',
  updatedAt = 'updated_at',
  status = 'status',
}

export const sortingKeys = Object.keys(convertSortBy);

export const sortingConstraints = {
  sa: ['id', 'login', 'email', 'createdAt'],
  quizQuestions: ['body', 'id', 'correctAnswers', 'published', 'updatedAt'],
  quizGames: [
    'id',
    'startGameDate',
    'pairCreatedDate',
    'finishGameDate',
    'status',
  ],
  blogs: [
    'id',
    'name',
    'description',
    'websiteUrl',
    'isMembership',
    'createdAt',
  ],
  posts: [
    'id',
    'title',
    'shortDescription',
    'content',
    'blogId',
    'blogName',
    'createdAt',
  ],
  comments: ['id', 'content', 'userId', 'userLogin', 'createdAt'],
  default: sortingKeys,
};

export const SortStatFields = [
  'avgScores',
  'sumScore',
  'winsCount',
  'lossesCount',
  'drawsCount',
  'gamesCount',
];
export type SortByType = keyof typeof sortingConstraints;

export const DefaultSortValues = ['avgScores desc', 'sumScore desc'];

export enum SortDirections {
  Asc = 'asc',
  Desc = 'desc',
  ASC = 'ASC',
  DESC = 'DESC',
  asc = 'asc',
  desc = 'desc',
}
export const SortDirectionValues = Object.keys(SortDirections);

export abstract class BaseFilter {
  @IsOptional()
  @IsString()
  sortBy: string;

  // @IsEnum(SortDirections)
  @IsOptional()
  @IsString()
  abstract sortDirection: string;

  @IsOptional()
  @IsString()
  // @Min(1)
  // @Max(51)
  abstract pageSize: string;

  @IsOptional()
  @IsString()
  // @Min(1)
  // @Max(51)
  abstract pageNumber: string;

  @IsOptional()
  @IsString()
  searchNameTerm?: string;

  @IsOptional()
  @IsString()
  searchEmailTerm?: string;

  @IsOptional()
  @IsString()
  searchLoginTerm?: string;

  @IsOptional()
  @IsString()
  searchContentTerm?: string;
}


export class PaginationViewModel<P> {
  public readonly pagesCount: number;
  public readonly page: number;
  public readonly pageSize: number;
  public readonly totalCount: number;
  public readonly items: P[];

  constructor(items: P[], page: number, pageSize: number, totalCount: number) {
    this.pagesCount = Math.ceil(totalCount / pageSize);
    this.page = page;
    this.pageSize = pageSize;
    this.totalCount = +totalCount || 0;

    this.items = items;
  }
}

type QueryType = Record<string, string | string[]>;

export class PaginationFilter {
  public readonly pageNumber: number;
  public readonly pageSize: number;
  public readonly sortDirection: SortDirection;
  public readonly sortBy: string;

  constructor(query: QueryType, sortProperties: string[] = []) {
    this.sortBy = this.getSortBy(query, sortProperties);
    this.sortDirection = this.getSortDirection(query);
    this.pageNumber = query.pageNumber ? Math.min(+query.pageNumber, 50) : 1;
    this.pageSize = query.pageSize ? Math.min(+query.pageSize, 50) : 10;
  }

  public getSortDirectionInNumericFormat(): number {
    return this.sortDirection === 'asc' ? 1 : -1;
  }

  public getSkipItemsCount() {
    return (this.pageNumber - 1) * this.pageSize;
  }

  public getSortDirection(query: QueryType) {
    let sortDirection: SortDirection = query.sortDirection === 'asc' ? 1 : -1;
    return sortDirection;
  }

  public getSortBy(query: QueryType, sortProperties: string[]): string {
    let result = 'createdAt';

    const querySortBy = query.sortBy;

    if (Array.isArray(querySortBy)) {
      for (let i = 0; i < querySortBy.length; i++) {
        const param = querySortBy[i] + '';

        if (sortProperties.includes(param)) {
          result = param;
          break;
        }
      }
    } else {
      if (sortProperties.includes(querySortBy.toString())) {
        result = querySortBy.toString();
      }
    }

    return result;
  }
}
