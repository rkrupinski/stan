import type { ReadonlyState, State } from './state';
import { makeCache, type CachePolicy } from './cache';
import {
  type SerializableParam,
  REFRESH_TAG,
  dejaVu,
  isPromiseLike,
  stableStringify,
} from './misc';

export interface GetFn {
  <T>(state: State<T>): T;
}

export type SelectorFn<T> = ({ get }: { get: GetFn }) => T;

export type SelectorOptions = {
  tag?: string;
  areValuesEqual?: <T>(a: T, b: T) => boolean;
};

export const selector = <T>(
  selectorFn: SelectorFn<T>,
  { tag, areValuesEqual = dejaVu }: SelectorOptions = {},
): ReadonlyState<T> => {
  let initialized = false;
  let mounted = false;
  let value: T;

  const subscribers = new Set<(newValue: T) => void>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deps = new Set<State<any>>();
  const unsubs = new Set<() => void>();

  const get = <V>(state: State<V>) => {
    let currentValue = state.get();

    if (!deps.has(state)) {
      deps.add(state);

      const unsubscribe = state.subscribe(newValue => {
        if (areValuesEqual(currentValue, newValue)) return;
        currentValue = newValue;
        evaluate();
        notifySubscribers();
      });

      unsubs.add(unsubscribe);
    }

    return currentValue;
  };

  const cleanup = () => {
    unsubs.forEach(unsub => unsub());
    unsubs.clear();
    deps.clear();
  };

  const evaluate = () => {
    cleanup();

    value = selectorFn({ get });

    if (isPromiseLike(value))
      value.then(undefined, () => {
        initialized = false;
      });
  };

  const notifySubscribers = () => {
    subscribers.forEach(cb => cb(value));
  };

  const onMount = () => {
    mounted = true;
  };

  const onUnmount = () => {
    mounted = false;
  };

  return {
    tag,
    get() {
      if (!initialized) {
        initialized = true;
        evaluate();
      }

      return value;
    },
    subscribe(cb) {
      if (subscribers.size === 0) onMount();
      subscribers.add(cb);

      return function unsubscribe() {
        subscribers.delete(cb);
        if (subscribers.size === 0) onUnmount();
      };
    },
    [REFRESH_TAG]() {
      if (mounted) {
        evaluate();
        notifySubscribers();
      } else {
        initialized = false;
      }
    },
  };
};

export type SelectorFamilyFn<T, P extends SerializableParam> = (
  param: P,
) => SelectorFn<T>;

export type SelectorFamilyOptions = SelectorOptions & {
  cachePolicy?: CachePolicy;
};

export const selectorFamily = <T, P extends SerializableParam>(
  selectorFamilyFn: SelectorFamilyFn<T, P>,
  {
    tag,
    areValuesEqual = dejaVu,
    cachePolicy = { type: 'keep-all' },
  }: SelectorFamilyOptions = {},
) => {
  const cache = makeCache<ReadonlyState<T>>(cachePolicy);

  return (param: P) => {
    const key = stableStringify(param);

    if (!cache.has(key)) {
      cache.set(
        key,
        selector(selectorFamilyFn(param), { tag, areValuesEqual }),
      );
    }

    return cache.get(key) as ReadonlyState<T>;
  };
};
