import type { Store } from './store';

export { default as stableStringify } from 'fast-json-stable-stringify';

export const REFRESH_TAG = Symbol('@@refresh@@');
export const RESET_TAG = Symbol('@@reset@@');
export const ERASE_TAG = Symbol('@@erase@@');
export const MOUNT_TAG = Symbol('@@mount@@');
export const UNMOUNT_TAG = Symbol('@@unmount@@');

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

export const erase = (store: Store, key: string) => {
  store.deps.delete(key);
  store.value.delete(key);
  store.version.delete(key);
  store.mounted.delete(key);
  store.initialized.delete(key);
};

export const depsChanged = (store: Store, key: string) => {
  const d = store.deps.get(key);

  if (!d || !d.size) return false;

  for (const [k, v] of d.entries()) {
    if (store.version.get(k) !== v) return true;
  }

  for (const k of d.keys()) {
    if (depsChanged(store, k)) return true;
  }

  return false;
};
