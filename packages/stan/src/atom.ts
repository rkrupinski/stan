import type { SetterOrUpdater, WritableState } from './state';
import { isFunction, stableStringify, type SerializableParam } from './misc';
import { makeCache } from './cache';

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
  { effects, tag }: AtomOptions<T> = {},
): WritableState<T> => {
  let initialized = false;
  let value: T = initialValue;

  const subscribed = new Set<(newValue: T) => void>();
  const effectSubs = new Set<(newValue: T) => void>();

  const makeSet =
    (silent = false): SetterOrUpdater<T> =>
    newValue => {
      value = isFunction(newValue) ? newValue(value) : newValue;

      subscribed.forEach(cb => cb(value));
      if (!silent) effectSubs.forEach(cb => cb(value));
    };

  const setupEffects = () => {
    effects?.forEach(effectFn =>
      effectFn({
        init(v) {
          if (!initialized) {
            value = v;
          }
        },
        set: makeSet(true),
        onSet(cb) {
          effectSubs.add(cb);
        },
      }),
    );
  };

  return {
    tag,
    get() {
      if (!initialized) {
        setupEffects();
        initialized = true;
      }
      return value;
    },
    set: makeSet(),
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
          isFunction(initialValue) ? initialValue(param) : initialValue,
          options,
        ),
      );
    }

    return cache.get(key) as WritableState<T>;
  };
};
