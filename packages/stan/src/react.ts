import { useState, useEffect, useCallback, useRef } from 'react';

import type { State, ReadonlyState, WritableState } from './state';
import { refresh } from './utils';

export type AsyncValue<T> =
  | { type: 'loading' }
  | { type: 'ready'; value: T }
  | { type: 'error'; reason: string };

export const useStanValue = <T>(state: State<T>) => {
  const prevStateRef = useRef(state);
  const [value, setValue] = useState(state.get());

  useEffect(() => {
    if (state !== prevStateRef.current) {
      setValue(state.get());
      prevStateRef.current = state;
    }

    return state.subscribe(setValue);
  }, [state]);

  return value;
};

export const useStan = <T>(state: WritableState<T>) =>
  [useStanValue(state), state.set] as const;

export const useStanValueAsync = <T>(state: ReadonlyState<PromiseLike<T>>) => {
  const value = useStanValue(state);

  const [asyncValue, setAsyncValue] = useState<AsyncValue<T>>({
    type: 'loading',
  });

  useEffect(() => {
    let active = true;

    if (asyncValue.type !== 'loading') setAsyncValue({ type: 'loading' });

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

export const useSetStanValue = <T>(state: WritableState<T>) => state.set;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useStanRefresher = (state: ReadonlyState<any>) =>
  useCallback(() => {
    refresh(state);
  }, [state]);
