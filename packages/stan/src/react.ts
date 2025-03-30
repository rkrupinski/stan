import { useSyncExternalStore, useState, useEffect, useCallback } from 'react';

import type { State, ReadonlyState, WritableState } from './state';
import { refresh } from './utils';

export type AsyncValue<T> =
  | { type: 'loading' }
  | { type: 'ready'; value: T }
  | { type: 'error'; reason: string };

export const useStan = <T>(state: WritableState<T>) =>
  [useSyncExternalStore(state.subscribe, state.get), state.set] as const;

export const useStanValue = <T>(state: State<T>) =>
  useSyncExternalStore(state.subscribe, state.get);

export const useStanValueAsync = <T>(state: ReadonlyState<PromiseLike<T>>) => {
  const rawValue = useSyncExternalStore(state.subscribe, state.get);

  const [asyncValue, setAsyncValue] = useState<AsyncValue<T>>({
    type: 'loading',
  });

  useEffect(() => {
    let active = true;

    if (asyncValue.type !== 'loading') setAsyncValue({ type: 'loading' });

    rawValue.then(
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
            reason: err?.message ?? 'unknown',
          });
      },
    );

    return () => {
      active = false;
    };
  }, [rawValue]);

  return asyncValue;
};

export const useSetStanValue = <T>(state: WritableState<T>) => state.set;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useStanRefresher = (state: ReadonlyState<any>) =>
  useCallback(() => {
    refresh(state);
  }, [state]);
