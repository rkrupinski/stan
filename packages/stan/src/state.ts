import type { SetterOrUpdater } from './types';
import type { REFRESH_TAG, RESET_TAG } from './internal';

export interface State<T> {
  key: string;
  get(): T;
  subscribe(callback: (value: T) => void): () => void;
}

export interface ReadonlyState<T> extends State<T> {
  [REFRESH_TAG](): void;
}

export interface WritableState<T> extends State<T> {
  set: SetterOrUpdater<T>;
  [RESET_TAG](): void;
}
