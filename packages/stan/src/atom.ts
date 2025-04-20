import type { SerializableParam, SetterOrUpdater, TagFromParam } from './types';
import {
  isFunction,
  RESET_TAG,
  stableStringify,
  type TypedOmit,
} from './internal';
import type { WritableState } from './state';
import type { Scoped } from './store';
import { memoize } from './cache';

let atomId = 0;

export type AtomEffect<T> = (param: {
  init(value: T): void;
  set: SetterOrUpdater<T>;
  onSet(cb: (value: T) => void): void;
}) => void;

export type AtomOptions<T> = {
  tag?: string;
  effects?: ReadonlyArray<AtomEffect<T>>;
};

export const atom = <T>(
  initialValue: T,
  { tag, effects }: AtomOptions<T> = {},
): Scoped<WritableState<T>> => {
  const defaultValue = initialValue;
  const key = `atom${tag ? `-${tag}` : ''}-${atomId++}`;

  return memoize(store => {
    const subscribed = new Set<(newValue: T) => void>();
    const effectSubs = new Set<(newValue: T) => void>();

    const makeSetter =
      (silent = false): SetterOrUpdater<T> =>
      newValue => {
        if (!store.initialized.get(key)) return;

        const prevValue = store.value.get(key);
        const value = isFunction(newValue) ? newValue(prevValue) : newValue;

        store.value.set(key, value);
        subscribed.forEach(cb => cb(value));
        if (!silent) effectSubs.forEach(cb => cb(value));
      };

    const set = makeSetter();
    const setSilent = makeSetter(true);

    const initialize = () => {
      store.value.set(key, defaultValue);

      effects?.forEach(effectFn =>
        effectFn({
          init(v) {
            if (!store.initialized.get(key)) {
              store.value.set(key, v);
            }
          },
          set: setSilent,
          onSet(cb) {
            effectSubs.add(cb);
          },
        }),
      );
    };

    return {
      tag,
      get() {
        if (!store.initialized.get(key)) {
          initialize();
          store.initialized.set(key, true);
        }

        return store.value.get(key);
      },
      set,
      subscribe(cb) {
        subscribed.add(cb);

        return () => {
          subscribed.delete(cb);
        };
      },
      [RESET_TAG]() {
        set(defaultValue);
      },
    };
  });
};

export type ValueFromParam<T, P extends SerializableParam> = (param: P) => T;

export type AtomFamilyOptions<T, P extends SerializableParam> = TypedOmit<
  AtomOptions<T>,
  'tag'
> & {
  tag?: string | TagFromParam<P>;
};

export const atomFamily = <T, P extends SerializableParam>(
  initialValue: T | ValueFromParam<T, P>,
  { tag, ...other }: AtomFamilyOptions<T, P> = {},
) =>
  memoize(
    (param: P) =>
      atom(isFunction(initialValue) ? initialValue(param) : initialValue, {
        tag: isFunction(tag) ? tag(param) : tag,
        ...other,
      }),
    { keyMaker: stableStringify },
  );
