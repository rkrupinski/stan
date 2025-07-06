import type { Store } from './store';

export { default as stableStringify } from 'fast-json-stable-stringify';

export const REFRESH_TAG = Symbol('@@refresh@@');
export const RESET_TAG = Symbol('@@reset@@');
export const ERASE_TAG = Symbol('@@erase@@');

export const dejaVu = <T>(a: T, b: T) => a === b;

export const identity = <T>(arg: T) => arg;

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

export const erase = (store: Store, key: string) => {
  store.deps.delete(key);
  store.value.delete(key);
  store.version.delete(key);
  store.mounted.delete(key);
  store.initialized.delete(key);
};
