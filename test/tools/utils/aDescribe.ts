export const aDescribe = (skip: boolean): jest.Describe =>
  skip ? describe.skip : describe;

export const uDescribe = (skip: boolean): jest.Describe =>
  skip ? describe.skip : describe;
