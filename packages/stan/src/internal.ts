export { default as stableStringify } from 'fast-json-stable-stringify';

export const REFRESH_TAG = Symbol('__refresh__');

export const RESET_TAG = Symbol('__reset__');

export const identity = <T>(arg: T) => arg;

export const dejaVu = <T>(a: T, b: T) => a === b;

export type TypedOmit<T, K extends keyof T> = Omit<T, K>;

const fnTypes = [
  '[object AsyncFunction]',
  '[object AsyncGeneratorFunction]',
  '[object GeneratorFunction]',
  '[object Function]',
];

export const isFunction = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  candidate: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): candidate is (...args: any[]) => any =>
  fnTypes.includes(Object.prototype.toString.call(candidate));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isPromiseLike = (candidate: any): candidate is PromiseLike<any> =>
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  !!candidate && isFunction(candidate.then);
