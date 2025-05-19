type Json =
  | string
  | number
  | boolean
  | null
  | { [property: string]: Json }
  | Json[];

export type SerializableParam = Json;

export type TypedOmit<T, K extends keyof T> = Omit<T, K>;

export type TagFromParam<P extends SerializableParam> = (param: P) => string;

export type SetterOrUpdater<T> = (
  valueOrUpdater: ((currentValue: T) => T) | T,
) => void;
