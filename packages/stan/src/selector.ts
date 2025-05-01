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
    const deps = new Map<string, 'TODO'>();
    const subs = new Set<() => () => void>();
    const unsubs = new Set<() => void>();
    let controller: AbortController | null = null;
    let version = 0;

    const subscribers = new Set<(newValue: T) => void>();

    const get = <D>(scopedState: Scoped<State<D>>) => {
      const state = scopedState(store);
      let curr = state.get();

      if (!deps.has(state.key)) {
        deps.set(state.key, 'TODO');
        console.log(`adding to deps of ${key}`, deps);

        const sub = () =>
          state.subscribe(val => {
            if (areValuesEqual(curr, val)) return;
            curr = val;
            refresh();
          });

        subs.add(sub);

        if (store.mounted.get(key)) {
          unsubs.add(sub());
        }
      }

      return curr;
    };

    const cleanup = () => {
      deps.clear(); // TODO
      subs.clear();
      unsubs.forEach(unsub => unsub());
      unsubs.clear();
    };

    const evaluate = () => {
      console.log(`${key} evaluate`);
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

    const refresh = () => {
      if (store.mounted.get(key)) {
        console.log(`${key} refresh-eval`);
        evaluate();
        notifySubscribers();
      } else {
        console.log(`${key} refresh-invalidate`);
        store.initialized.set(key, false);
      }
    };

    const onMount = () => {
      subs.forEach(sub => {
        unsubs.add(sub());
      });
      store.mounted.set(key, true);
      console.log(`${key} onMount`);
    };

    const onUnmount = () => {
      unsubs.forEach(unsub => unsub());
      unsubs.clear();
      store.mounted.set(key, false);
      console.log(`${key} onUnmount`);
    };

    return {
      key,
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
        refresh();
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
