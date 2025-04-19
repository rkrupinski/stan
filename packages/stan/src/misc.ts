export { default as stableStringify } from 'fast-json-stable-stringify';

type Json =
  | string
  | number
  | boolean
  | null
  | { [property: string]: Json }
  | Json[];

export type SerializableParam = Json;

export type TagFromParam<P extends SerializableParam> = (param: P) => string;

export type TypedOmit<T, K extends keyof T> = Omit<T, K>;

export type SetterOrUpdater<T> = (
  valueOrUpdater: ((currentValue: T) => T) | T,
) => void;

export const REFRESH_TAG = Symbol('__refresh__');

export const dejaVu = <T>(a: T, b: T) => a === b;

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
  !!candidate && isFunction(candidate.then);

export const identity = <T>(arg: T) => arg;
