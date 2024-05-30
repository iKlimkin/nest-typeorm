export const wait = (sec: number): Promise<void> =>
  new Promise((resolve) => setTimeout(() => resolve(), sec * 1000));
