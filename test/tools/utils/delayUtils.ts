export const wait = (sec: number): Promise<boolean> =>
  new Promise((res) => setTimeout(() => res(true), sec * 1000));
