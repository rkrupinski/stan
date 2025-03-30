import type { SetterOrUpdater, WritableState } from './state';
import { stableStringify, type SerializableParam } from './misc';
import { makeCache } from './cache';

export type AtomEffect<T> = (param: {
  init(value: T): void;
  set: SetterOrUpdater<T>;
  onSet(cb: (value: T) => void): void;
}) => void;

export type AtomOptions<T> = {
  effects?: ReadonlyArray<AtomEffect<T>>;
};

export const atom = <T>(
  initialValue: T,
  { effects }: AtomOptions<T> = {},
): WritableState<T> => {
  let initialized = false;
  let value: T = initialValue;

  const subscribed = new Set<(newValue: T) => void>();

  const set: SetterOrUpdater<T> = newValue => {
    value = newValue instanceof Function ? newValue(value) : newValue;

    subscribed.forEach(cb => cb(value));
  };

  effects?.forEach(effectFn =>
    effectFn({
      init(v) {
        if (!initialized) {
          value = v;
        }
      },
      set,
      onSet(cb) {
        subscribed.add(cb);
      },
    }),
  );

  initialized = true;

  return {
    get() {
      return value;
    },
    set,
    subscribe(cb) {
      subscribed.add(cb);

      return () => {
        subscribed.delete(cb);
      };
    },
  };
};

export type ValueFromParam<T, P extends SerializableParam> = (param: P) => T;

export const atomFamily = <T, P extends SerializableParam>(
  initialValue: T | ValueFromParam<T, P>,
  options?: AtomOptions<T>,
) => {
  const cache = makeCache<WritableState<T>>({ type: 'keep-all' });

  return (param: P) => {
    const key = stableStringify(param);

    if (!cache.has(key)) {
      cache.set(
        key,
        atom(
          initialValue instanceof Function ? initialValue(param) : initialValue,
          options,
        ),
      );
    }

    return cache.get(key) as WritableState<T>;
  };
};
