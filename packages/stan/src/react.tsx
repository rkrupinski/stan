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
} from 'react';

import type { State, ReadonlyState, WritableState } from './state';
import { DEFAULT_STORE, makeStore, type Scoped, type Store } from './store';
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

export type AsyncValue<T> =
  | { type: 'loading' }
  | { type: 'ready'; value: T }
  | { type: 'error'; reason: string };

export const useStanValueAsync = <T,>(
  scopedState: Scoped<State<PromiseLike<T>>>,
) => {
  const value = useStanValue(scopedState);

  const [asyncValue, setAsyncValue] = useState<AsyncValue<T>>({
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (err: any) => {
        if (active)
          setAsyncValue({
            type: 'error',
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            reason: err?.message ?? 'unknown',
          });
      },
    );

    return () => {
      active = false;
    };
  }, [value]);

  return asyncValue;
};

export const useStanRefresher = <T,>(scopedState: Scoped<ReadonlyState<T>>) => {
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
