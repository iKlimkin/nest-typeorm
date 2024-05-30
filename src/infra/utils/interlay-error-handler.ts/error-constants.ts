export enum CreateUserErrors {
  Validation = 2,
  DatabaseFail = 3,
}

export enum GetErrors {
  DatabaseFail = 500,
  Transaction = 500,
  NotCreated = 500,
  NotFound = 404,
  Forbidden = 403,
  IncorrectModel = 400,
  IncorrectPassword = 401,
}
