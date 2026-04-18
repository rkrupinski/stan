import {
  computed,
  defineComponent,
  inject,
  onScopeDispose,
  provide,
  readonly,
  shallowRef,
  watch,
  type ComputedRef,
  type InjectionKey,
  type PropType,
  type Ref,
  type WritableComputedRef,
} from 'vue';

import type { Scoped, State, ReadonlyState, WritableState } from './state';
import { DEFAULT_STORE, makeStore, type Store } from './store';
import { refresh, reset } from './utils';

export type StanStoreInjection = {
  store: ComputedRef<Store>;
};

const StanStoreKey: InjectionKey<StanStoreInjection> = Symbol('stan');

export const useStanStore = (): StanStoreInjection =>
  inject(StanStoreKey, { store: computed(() => DEFAULT_STORE) });

export const provideStan = (store?: Store): void => {
  const resolved = store ?? makeStore();

  provide(StanStoreKey, {
    store: computed(() => resolved),
  });
};

export type StanProviderProps = {
  store?: Store;
};

export const StanProvider = defineComponent({
  name: 'StanProvider',
  props: {
    store: { type: Object as PropType<Store>, default: undefined },
  },
  setup(props, { slots }) {
    let fallback: Store | undefined;

    provide(StanStoreKey, {
      store: computed(() => props.store ?? (fallback ??= makeStore())),
    });
    return () => slots.default?.();
  },
});

export const useStanValue = <T>(
  scopedState: Scoped<ReadonlyState<T>>,
): Readonly<Ref<T>> => {
  const { store } = useStanStore();
  const state = scopedState(store.value);
  const value = shallowRef(state.get()) as Ref<T>;

  const unsubscribe = state.subscribe(newValue => {
    value.value = newValue;
  });

  onScopeDispose(unsubscribe);

  return readonly(value) as Readonly<Ref<T>>;
};

export const useStan = <T>(
  scopedState: Scoped<WritableState<T>>,
): WritableComputedRef<T> => {
  const { store } = useStanStore();
  const state = scopedState(store.value);
  const value = shallowRef(state.get()) as Ref<T>;

  const unsubscribe = state.subscribe(newValue => {
    value.value = newValue;
  });

  onScopeDispose(unsubscribe);

  return computed({
    get: () => value.value,
    set: (newValue: T) => {
      state.set(newValue);
    },
  });
};

export type AsyncValue<T, E = unknown> =
  | { type: 'loading' }
  | { type: 'ready'; value: T }
  | { type: 'error'; reason: E };

export const useStanValueAsync = <T, E = unknown>(
  scopedState: Scoped<ReadonlyState<PromiseLike<T>>>,
): Readonly<Ref<AsyncValue<T, E>>> => {
  const promiseRef = useStanValue(scopedState);

  const asyncValue = shallowRef<AsyncValue<T, E>>({ type: 'loading' });

  watch(
    promiseRef,
    (promise, _oldValue, onCleanup) => {
      asyncValue.value = { type: 'loading' };

      let active = true;

      onCleanup(() => {
        active = false;
      });

      promise.then(
        value => {
          if (active) asyncValue.value = { type: 'ready', value };
        },
        (reason: unknown) => {
          if (active) asyncValue.value = { type: 'error', reason: reason as E };
        },
      );
    },
    { immediate: true, flush: 'sync' },
  );

  return readonly(asyncValue) as Readonly<Ref<AsyncValue<T, E>>>;
};

export const useStanRefresh = <T>(scopedState: Scoped<ReadonlyState<T>>) => {
  const { store } = useStanStore();
  const state = scopedState(store.value);

  return () => {
    refresh(state);
  };
};

export const useStanReset = <T>(scopedState: Scoped<WritableState<T>>) => {
  const { store } = useStanStore();
  const state = scopedState(store.value);

  return () => {
    reset(state);
  };
};

export type StanCallbackHelpers = {
  get: <T>(scopedState: Scoped<State<T>>) => T;
  set: <T>(
    scopedState: Scoped<WritableState<T>>,
    valueOrUpdater: T | ((currentValue: T) => T),
  ) => void;
  reset: <T>(scopedState: Scoped<WritableState<T>>) => void;
  refresh: <T>(scopedState: Scoped<ReadonlyState<T>>) => void;
};

export const useStanCallback = <A extends unknown[], R>(
  factory: (helpers: StanCallbackHelpers) => (...args: A) => R,
) => {
  const { store } = useStanStore();

  return (...args: A) => {
    const helpers: StanCallbackHelpers = {
      get: scopedState => scopedState(store.value).get(),
      set: (scopedState, valueOrUpdater) => {
        scopedState(store.value).set(valueOrUpdater);
      },
      reset: scopedState => {
        reset(scopedState(store.value));
      },
      refresh: scopedState => {
        refresh(scopedState(store.value));
      },
    };

    return factory(helpers)(...args);
  };
};
