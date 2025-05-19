type Json =
  | string
  | number
  | boolean
  | null
  | { [property: string]: Json }
  | Json[];

export type SerializableParam = Json;

export type TagFromParam<P extends SerializableParam> = (param: P) => string;

export type SetterOrUpdater<T> = (
  valueOrUpdater: ((currentValue: T) => T) | T,
) => void;
