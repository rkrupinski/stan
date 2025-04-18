import {
  isFunction,
  stableStringify,
  type TypedOmit,
  type TagFromParam,
  type SerializableParam,
} from './misc';
import type { SetterOrUpdater, WritableState } from './state';
import { DEFAULT_STORE, type Scoped } from './store';
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

  return memoize((store = DEFAULT_STORE) => {
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

    const initialize = () => {
      store.value.set(key, defaultValue);

      effects?.forEach(effectFn =>
        effectFn({
          init(v) {
            if (!store.initialized.get(key)) {
              store.value.set(key, v);
            }
          },
          set: makeSetter(true),
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
      set: makeSetter(),
      subscribe(cb) {
        subscribed.add(cb);

        return () => {
          subscribed.delete(cb);
        };
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
