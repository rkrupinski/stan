export { default as stableStringify } from 'fast-json-stable-stringify';

type Json =
  | string
  | number
  | boolean
  | null
  | { [property: string]: Json }
  | Json[];

export type SerializableParam = Json;

export const REFRESH_TAG = Symbol('__refresh__');

export const dejaVu = <T>(a: T, b: T) => a === b;
