import { ErrorsMessages } from '../../../src/infra/utils/error-handler';

enum errors {
  title = 'title',
  name = 'name',
  login = 'login',
  shortDescription = 'shortDescription',
  description = 'description',
  blogId = 'blogId',
  content = 'content',
  postId = 'postId',
  email = 'email',
  loginOrEmail = 'loginOrEmail',
  websiteUrl = 'websiteUrl',
  password = 'password',
}

type ErrorMessagesType = keyof typeof errors;

export const createExceptions = (
  fields: ErrorMessagesType[],
  message?: string,
) => {
  const errorsMessages: ErrorsMessages[] = [];
  for (const field of fields) {
    errorsMessages.push({
      message: message ?? expect.any(String),
      field: field ?? expect.any(String),
    });
  }
  return { errorsMessages };
};
