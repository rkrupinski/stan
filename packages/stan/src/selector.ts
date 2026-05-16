import {
  dejaVu,
  isFunction,
  stableStringify,
  ERASE_TAG,
  REFRESH_TAG,
  MOUNT_TAG,
  UNMOUNT_TAG,
  type TypedOmit,
} from './internal';
import { Aborted } from './errors';
import type { SerializableParam, TagFromParam } from './types';
import type { ReadonlyState, State, Scoped } from './state';
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

type SelectorCtx = {
  [ERASE_TAG]?: AbortSignal;
  [MOUNT_TAG]?: () => void;
  [UNMOUNT_TAG]?: () => void;
};

export const selector = <T>(
  selectorFn: SelectorFn<T>,
  { tag, areValuesEqual = dejaVu }: SelectorOptions = {},
  {
    [ERASE_TAG]: eraseSignal,
    [MOUNT_TAG]: onMountCb,
    [UNMOUNT_TAG]: onUnmountCb,
  }: SelectorCtx = {},
): Scoped<ReadonlyState<T>> => {
  const key = `@@selector${tag ? `[${tag}]` : ''}-${++selectorId}`;

  return memoize(store => () => {
    const subs = new Set<() => () => void>();
    const unsubs = new Set<() => void>();

    let controller: AbortController | null = null;

    eraseSignal?.addEventListener(
      'abort',
      () => {
        controller?.abort(new Aborted());
        store.erase(key);
      },
      { once: true },
    );

    const subscribers = new Set<(newValue: T) => void>();

    const makeGetter =
      (id: number) =>
      <D>(scopedState: Scoped<State<D>>) => {
        const state = scopedState(store);
        const value = state.get();

        if (id === evalId && store.trackDep(key, state.key)) {
          const sub = () =>
            state.subscribe(() => {
              refresh();
            });

          subs.add(sub);

          if (store.isMounted(key)) {
            unsubs.add(sub());
          }
        }

        return value;
      };

    const cleanup = () => {
      store.resetDeps(key);
      subs.clear();
      unsubs.forEach(unsub => unsub());
      unsubs.clear();
    };

    const notifySubscribers = () => {
      [...subscribers].forEach(cb => cb(store.peek<T>(key)));
    };

    let evalId = 0;

    const evaluate = () => {
      cleanup();

      controller?.abort(new Aborted());
      controller = new AbortController();

      const candidate = selectorFn({
        get: makeGetter(++evalId),
        signal: controller.signal,
      });

      const valueChanged =
        !store.has(key) || !areValuesEqual(store.peek<T>(key), candidate);

      if (!valueChanged) return;

      store.commit(key, candidate);

      notifySubscribers();
    };

    const refresh = () => {
      if (store.isMounted(key)) {
        evaluate();
      } else {
        store.markStale(key);
      }
    };

    const onMount = () => {
      subs.forEach(sub => {
        unsubs.add(sub());
      });
      store.mount(key);
      onMountCb?.();
    };

    const onUnmount = () => {
      unsubs.forEach(unsub => {
        unsub();
      });
      unsubs.clear();
      store.unmount(key);
      onUnmountCb?.();
    };

    return {
      key,
      get() {
        switch (true) {
          case !store.isReady(key):
            evaluate();
            store.markReady(key);
            break;

          case store.depsChanged(key):
            evaluate();
            break;

          default:
            break;
        }

        return store.peek<T>(key);
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
    (param: P, { retain, release }) =>
      signal =>
        selector(
          selectorFamilyFn(param),
          {
            tag: isFunction(tag) ? tag(param) : tag,
            ...other,
          },
          {
            [ERASE_TAG]: signal,
            [MOUNT_TAG]: retain,
            [UNMOUNT_TAG]: release,
          },
        ),
    {
      cachePolicy,
      keyMaker: stableStringify,
    },
  );
