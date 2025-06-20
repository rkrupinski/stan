import type { SerializableParam, SetterOrUpdater, TagFromParam } from './types';
import {
  dejaVu,
  isFunction,
  stableStringify,
  RESET_TAG,
  type TypedOmit,
} from './internal';
import type { WritableState, Scoped } from './state';
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
  areValuesEqual?: <T>(a: T, b: T) => boolean;
};

export const atom = <T>(
  initialValue: T,
  { tag, effects, areValuesEqual = dejaVu }: AtomOptions<T> = {},
): Scoped<WritableState<T>> => {
  const defaultValue = initialValue;
  const key = `a${tag ? `-${tag}` : ''}-${atomId++}`;

  return memoize(store => {
    const subscribed = new Set<(newValue: T) => void>();
    const effectSubs = new Set<(newValue: T) => void>();

    store.value.set(key, defaultValue);
    store.version.set(key, 1);

    const bumpVersion = () => {
      const currentVersion = store.version.get(key) ?? 0;

      store.version.set(key, currentVersion + 1);
    };

    const makeSetter =
      (silent = false): SetterOrUpdater<T> =>
      newValue => {
        if (!store.initialized.get(key)) return;

        const prevValue = store.value.get(key) as T;
        const candidate = isFunction(newValue) ? newValue(prevValue) : newValue;

        if (areValuesEqual(prevValue, candidate)) return;

        bumpVersion();

        store.value.set(key, candidate);

        [...subscribed].forEach(cb => cb(candidate));

        if (!silent) effectSubs.forEach(cb => cb(candidate));
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
      key,
      get() {
        if (!store.initialized.get(key)) {
          initialize();
          store.initialized.set(key, true);
        }

        return store.value.get(key) as T;
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
