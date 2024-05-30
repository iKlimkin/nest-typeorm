export interface SuperTestBody<T = unknown> {
  body: T & {
    errors: string[];
  };
}
