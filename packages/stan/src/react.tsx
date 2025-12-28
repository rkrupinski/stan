import {
  createContext,
  useMemo,
  useState,
  useEffect,
  useContext,
  useCallback,
  useRef,
  type FC,
  type ReactNode,
  type DependencyList,
} from 'react';

import type { Scoped, State, ReadonlyState, WritableState } from './state';
import { DEFAULT_STORE, makeStore, type Store } from './store';
import { refresh, reset } from './utils';

export type StanCtxType = {
  store: Store;
};

const StanCtx = createContext<StanCtxType>({
  store: DEFAULT_STORE,
});

export type StanProviderProps = {
  store?: Store;
  children: ReactNode;
};

export const StanProvider: FC<StanProviderProps> = ({ store, children }) => {
  const ctxValue = useMemo<StanCtxType>(
    () => ({
      store: store ?? makeStore(),
    }),
    [store],
  );

  return <StanCtx.Provider value={ctxValue}>{children}</StanCtx.Provider>;
};

export const useStanCtx = () => useContext(StanCtx);

export const useStanValue = <T,>(scopedState: Scoped<State<T>>) => {
  const { store } = useStanCtx();
  const state = scopedState(store);
  const prevStateRef = useRef(state);
  const [value, setValue] = useState(() => state.get());

  useEffect(() => {
    if (state !== prevStateRef.current) {
      prevStateRef.current = state;
      setValue(state.get());
    }

    return state.subscribe(setValue);
  }, [state]);

  return value;
};

export const useSetStanValue = <T,>(scopedState: Scoped<WritableState<T>>) => {
  const { store } = useStanCtx();
  const state = scopedState(store);

  return state.set;
};

export const useStan = <T,>(scopedState: Scoped<WritableState<T>>) =>
  [useStanValue(scopedState), useSetStanValue(scopedState)] as const;

export type AsyncValue<T, E = unknown> =
  | { type: 'loading' }
  | { type: 'ready'; value: T }
  | { type: 'error'; reason: E };

export const useStanValueAsync = <T, E = unknown>(
  scopedState: Scoped<State<PromiseLike<T>>>,
): AsyncValue<T, E> => {
  const value = useStanValue(scopedState);

  const [asyncValue, setAsyncValue] = useState<AsyncValue<T, E>>({
    type: 'loading',
  });

  useEffect(() => {
    let active = true;

    setAsyncValue({ type: 'loading' });

    value.then(
      value => {
        if (active)
          setAsyncValue({
            type: 'ready',
            value,
          });
      },
      (err: unknown) => {
        if (active)
          setAsyncValue({
            type: 'error',
            reason: err as E,
          });
      },
    );

    return () => {
      active = false;
    };
  }, [value]);

  return asyncValue;
};

export const useStanRefresh = <T,>(scopedState: Scoped<ReadonlyState<T>>) => {
  const { store } = useStanCtx();
  const state = scopedState(store);

  return useCallback(() => {
    refresh(state);
  }, [state]);
};

export const useStanReset = <T,>(scopedState: Scoped<WritableState<T>>) => {
  const { store } = useStanCtx();
  const state = scopedState(store);

  return useCallback(() => {
    reset(state);
  }, [state]);
};

export type StanCallbackHelpers = {
  set: <T>(
    scopedState: Scoped<WritableState<T>>,
    valueOrUpdater: T | ((currentValue: T) => T),
  ) => void;
  reset: <T>(scopedState: Scoped<WritableState<T>>) => void;
  refresh: <T>(scopedState: Scoped<ReadonlyState<T>>) => void;
};

export const useStanCallback = <A extends unknown[], R>(
  factory: (helpers: StanCallbackHelpers) => (...args: A) => R,
  deps: DependencyList = [],
) => {
  const { store } = useStanCtx();
  const factoryRef = useRef(factory);

  useEffect(() => {
    factoryRef.current = factory;
  });

  return useCallback(
    (...args: A) => {
      const helpers: StanCallbackHelpers = {
        set: (scopedState, valueOrUpdater) => {
          scopedState(store).set(valueOrUpdater);
        },
        reset: scopedState => {
          reset(scopedState(store));
        },
        refresh: scopedState => {
          refresh(scopedState(store));
        },
      };

      return factoryRef.current(helpers)(...args);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store, ...deps],
  );
};
