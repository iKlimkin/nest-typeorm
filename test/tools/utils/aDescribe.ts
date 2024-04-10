export const aDescribe = (skip: boolean): jest.Describe =>
  skip ? describe.skip : describe;
