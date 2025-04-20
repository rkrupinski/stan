import {
  dejaVu,
  REFRESH_TAG,
  isFunction,
  isPromiseLike,
  stableStringify,
  type TypedOmit,
} from './internal';
import { Aborted } from './errors';
import type { ReadonlyState, State } from './state';
import type { SerializableParam, TagFromParam } from './types';
import type { Scoped } from './store';
import { memoize, type CachePolicy } from './cache';

let selectorId = 0;

export interface GetFn {
  <T>(scopedState: Scoped<State<T>>): T;
}

export type SelectorFn<T> = (arg: { get: GetFn; signal: AbortSignal }) => T;

export type SelectorOptions = {
  tag?: string;
  areValuesEqual?: <T>(a: T, b: T) => boolean;
};

export const selector = <T>(
  selectorFn: SelectorFn<T>,
  { tag, areValuesEqual = dejaVu }: SelectorOptions = {},
): Scoped<ReadonlyState<T>> => {
  const key = `selector${tag ? `-${tag}` : ''}-${selectorId++}`;

  return memoize(store => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const deps = new Set<State<any>>();
    const subs = new Set<() => void>();
    let controller: AbortController | null = null;
    let version = 0;

    const subscribers = new Set<(newValue: T) => void>();

    const get = <D>(scopedState: Scoped<State<D>>) => {
      const state = scopedState(store);
      let curr = state.get();

      if (!deps.has(state)) {
        deps.add(state);

        subs.add(
          state.subscribe(val => {
            if (areValuesEqual(curr, val)) return;
            curr = val;
            evaluate();
            notifySubscribers();
          }),
        );
      }

      return curr;
    };

    const cleanup = () => {
      subs.forEach(unsub => unsub());
      subs.clear();
      deps.clear();
    };

    const evaluate = () => {
      const v = ++version;

      cleanup();

      controller?.abort(new Aborted());
      controller = new AbortController();

      const value = selectorFn({
        get,
        signal: controller.signal,
      });

      store.value.set(key, value);

      if (isPromiseLike(value))
        value.then(undefined, () => {
          if (v === version) store.initialized.set(key, false);
        });
    };

    const notifySubscribers = () => {
      subscribers.forEach(cb => cb(store.value.get(key)));
    };

    const onMount = () => {
      store.mounted.set(key, true);
    };

    const onUnmount = () => {
      store.mounted.set(key, false);
    };

    return {
      tag,
      get() {
        if (!store.initialized.get(key)) {
          evaluate();
          store.initialized.set(key, true);
        }

        return store.value.get(key);
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
        if (store.mounted.get(key)) {
          evaluate();
          notifySubscribers();
        } else {
          store.initialized.set(key, false);
          controller = null;
        }
      },
    };
  });
};

export type SelectorFamilyFn<T, P extends SerializableParam> = (
  param: P,
) => SelectorFn<T>;

export type SelectorFamilyOptions<P extends SerializableParam> = TypedOmit<
  SelectorOptions,
  'tag'
> & {
  tag?: string | TagFromParam<P>;
  cachePolicy?: CachePolicy;
};

export const selectorFamily = <T, P extends SerializableParam>(
  selectorFamilyFn: SelectorFamilyFn<T, P>,
  { cachePolicy, tag, ...other }: SelectorFamilyOptions<P> = {},
) =>
  memoize(
    (param: P) =>
      selector(selectorFamilyFn(param), {
        tag: isFunction(tag) ? tag(param) : tag,
        ...other,
      }),
    {
      cachePolicy,
      keyMaker: stableStringify,
    },
  );
