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

type DepEntry = {
  state: State<unknown>;
  unsub?: () => void;
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
    let deps = new Map<string, DepEntry>();

    let evaluating = false;

    let controller: AbortController | null = null;
    let gen = 0;
    let active = 0;

    eraseSignal?.addEventListener(
      'abort',
      () => {
        controller?.abort(new Aborted());
        store.erase(key);
      },
      { once: true },
    );

    const subscribers = new Set<(newValue: T) => void>();

    const notifySubscribers = () => {
      [...subscribers].forEach(cb => cb(store.peek<T>(key)));
    };

    const evaluate = () => {
      store.resetDeps(key);

      controller?.abort(new Aborted());
      controller = null;

      const myGen = ++gen;
      active = myGen;

      let mySignal: AbortSignal | undefined;

      const nextDeps = new Map<string, DepEntry>();

      evaluating = true;
      const candidate = selectorFn({
        get: <D>(scopedState: Scoped<State<D>>) => {
          const state = scopedState(store);
          const value = state.get();

          if (myGen === active && store.trackDep(key, state.key)) {
            const existing = deps.get(state.key);

            if (existing) {
              nextDeps.set(state.key, existing);
              deps.delete(state.key);
            } else {
              const entry: DepEntry = { state };

              if (store.isMounted(key)) {
                entry.unsub = state.subscribe(() => refresh());
              }

              nextDeps.set(state.key, entry);
            }
          }

          return value;
        },
        get signal() {
          if (!mySignal) {
            controller = new AbortController();
            mySignal = controller.signal;
          }
          return mySignal;
        },
      });
      evaluating = false;

      deps.forEach(entry => entry.unsub?.());
      deps = nextDeps;

      const valueChanged =
        !store.has(key) || !areValuesEqual(store.peek<T>(key), candidate);

      if (!valueChanged) return;

      store.commit(key, candidate);

      notifySubscribers();
    };

    const refresh = () => {
      if (evaluating) return;

      if (store.isMounted(key)) {
        evaluate();
      } else {
        store.markStale(key);
      }
    };

    const onMount = () => {
      deps.forEach(entry => {
        entry.unsub = entry.state.subscribe(() => refresh());
      });
      store.mount(key);
      onMountCb?.();
    };

    const onUnmount = () => {
      deps.forEach(entry => {
        entry.unsub?.();
        entry.unsub = undefined;
      });
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
