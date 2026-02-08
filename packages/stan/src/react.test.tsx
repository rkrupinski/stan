/**
 * @jest-environment jsdom
 */
import type { ReactNode } from 'react';
import { renderHook, act, waitFor, render } from '@testing-library/react';

import { selector, selectorFamily } from './selector';
import { makeStore } from './store';
import { atom } from './atom';
import {
  useStan,
  useStanValue,
  useStanValueAsync,
  useSetStanValue,
  useStanRefresh,
  useStanReset,
  useStanCallback,
  StanProvider,
} from './react';

describe('useStan', () => {
  it('should initialize with the current state value', () => {
    const testAtom = atom(42);

    const { result } = renderHook(() => useStan(testAtom), {
      wrapper: StanProvider,
    });

    expect(result.current[0]).toBe(42);
  });

  it('should propagate changes when setter is called with a new value', () => {
    const testAtom = atom(42);

    const { result } = renderHook(() => useStan(testAtom), {
      wrapper: StanProvider,
    });

    act(() => {
      result.current[1](43);
    });

    expect(result.current[0]).toBe(43);
  });

  it('should propagate changes when setter is called with an updater', () => {
    const testAtom = atom(42);

    const { result } = renderHook(() => useStan(testAtom), {
      wrapper: StanProvider,
    });

    act(() => {
      result.current[1](prev => prev + 1);
    });

    expect(result.current[0]).toBe(43);
  });

  it('should propagate changes when state is updated externally', () => {
    const testAtom = atom(42);
    const store = makeStore();

    const { result } = renderHook(() => useStan(testAtom), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <StanProvider store={store}>{children}</StanProvider>
      ),
    });

    act(() => {
      testAtom(store).set(43);
    });

    expect(result.current[0]).toBe(43);
  });

  it('should maintain setter reference', () => {
    const testAtom = atom(42);

    const { result, rerender } = renderHook(() => useStan(testAtom), {
      wrapper: StanProvider,
    });

    const prevSetter = result.current[1];

    act(() => {
      result.current[1](43);
    });

    rerender();

    expect(result.current[1]).toBe(prevSetter);
  });
});

describe('useStanValue', () => {
  it('should initialize with the current atom value', () => {
    const testAtom = atom(42);

    const { result } = renderHook(() => useStanValue(testAtom), {
      wrapper: StanProvider,
    });

    expect(result.current).toBe(42);
  });

  it('should initialize with the current selector value', () => {
    const testSelector = selector(() => 42);

    const { result } = renderHook(() => useStanValue(testSelector), {
      wrapper: StanProvider,
    });

    expect(result.current).toBe(42);
  });

  it('should initialize with the current async selector value', async () => {
    // eslint-disable-next-line @typescript-eslint/require-await
    const testSelector = selector(async () => 42);

    const { result } = renderHook(() => useStanValue(testSelector), {
      wrapper: StanProvider,
    });

    await expect(result.current).resolves.toBe(42);
  });

  it('should propagate changes', () => {
    const testAtom = atom(42);
    const testSelector = selector(({ get }) => get(testAtom) + 1);
    const store = makeStore();

    const { result, rerender } = renderHook(() => useStanValue(testSelector), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <StanProvider store={store}>{children}</StanProvider>
      ),
    });

    act(() => {
      testAtom(store).set(43);
    });

    rerender();

    expect(result.current).toBe(44);
  });

  it('should unsubscribe on unmount', () => {
    const testAtom = atom(42);
    const mockUnsubscribe = jest.fn();
    const store = makeStore();

    jest
      .spyOn(testAtom(store), 'subscribe')
      .mockReturnValueOnce(mockUnsubscribe);

    const { unmount } = renderHook(() => useStanValue(testAtom), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <StanProvider store={store}>{children}</StanProvider>
      ),
    });

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('should switch to a new state when the prop changes', () => {
    const atomA = atom('A');
    const atomB = atom('B');

    const { result, rerender } = renderHook(({ s }) => useStanValue(s), {
      initialProps: { s: atomA },
      wrapper: StanProvider,
    });

    expect(result.current).toBe('A');

    rerender({ s: atomB });

    expect(result.current).toBe('B');
  });

  it('should handle LRU cache eviction during simultaneous hook mounting', async () => {
    const evalCount = jest.fn();
    const CACHE_SIZE = 2;
    const ITEM_COUNT = 3; // > CACHE_SIZE

    const testFamily = selectorFamily(
      (id: number) => () => {
        evalCount(id);
        return id;
      },
      {
        cachePolicy: { type: 'lru', maxSize: CACHE_SIZE },
      },
    );

    const store = makeStore();

    const Child = ({ id }: { id: number }) => {
      useStanValue(testFamily(id));
      return null;
    };

    const App = () => (
      <StanProvider store={store}>
        {Array.from({ length: ITEM_COUNT }, (_, i) => (
          <Child key={i} id={i} />
        ))}
      </StanProvider>
    );

    render(<App />);

    // Wait a bit to let any potential loops run
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(evalCount).toHaveBeenCalledTimes(ITEM_COUNT);
  });
});

describe('useStanValueAsync', () => {
  it('should handle success', async () => {
    const testSelector = selector(() => Promise.resolve(42));

    const { result } = renderHook(() => useStanValueAsync(testSelector), {
      wrapper: StanProvider,
    });

    expect(result.current).toEqual({ type: 'loading' });

    await waitFor(() => {
      expect(result.current).toEqual({ type: 'ready', value: 42 });
    });
  });

  it('should handle errors', async () => {
    const error = new Error('Nope');
    const testSelector = selector(() => Promise.reject(error));

    const { result } = renderHook(() => useStanValueAsync(testSelector), {
      wrapper: StanProvider,
    });

    expect(result.current).toEqual({ type: 'loading' });

    await waitFor(() => {
      expect(result.current).toEqual({ type: 'error', reason: error });
    });
  });

  it('should handle changes in dependencies', async () => {
    const dep = atom(42);
    // eslint-disable-next-line @typescript-eslint/require-await
    const testSelector = selector(async ({ get }) => get(dep));
    const store = makeStore();

    const { result } = renderHook(() => useStanValueAsync(testSelector), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <StanProvider store={store}>{children}</StanProvider>
      ),
    });

    expect(result.current).toEqual({ type: 'loading' });

    await waitFor(() => {
      expect(result.current).toEqual({ type: 'ready', value: 42 });
    });

    act(() => {
      dep(store).set(43);
    });

    expect(result.current).toEqual({ type: 'loading' });

    await waitFor(() => {
      expect(result.current).toEqual({ type: 'ready', value: 43 });
    });
  });

  it('should unsubscribe on unmount', async () => {
    // eslint-disable-next-line @typescript-eslint/require-await
    const testSelector = selector(async () => 42);
    const mockUnsubscribe = jest.fn();
    const store = makeStore();

    jest
      .spyOn(testSelector(store), 'subscribe')
      .mockReturnValueOnce(mockUnsubscribe);

    const { unmount } = renderHook(() => useStanValue(testSelector), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <StanProvider store={store}>{children}</StanProvider>
      ),
    });

    unmount();

    await act(() => Promise.resolve());

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });
});

describe('useSetStanValue', () => {
  it('should maintain setter reference across renders', () => {
    const testAtom = atom(42);
    const { result, rerender } = renderHook(() => useSetStanValue(testAtom), {
      wrapper: StanProvider,
    });

    const prevSetter = result.current;

    rerender();

    expect(result.current).toBe(prevSetter);
  });

  it('should allow updating state with a new value', () => {
    const testAtom = atom(42);
    const store = makeStore();

    testAtom(store).get(); // Initialize

    const { result } = renderHook(() => useSetStanValue(testAtom), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <StanProvider store={store}>{children}</StanProvider>
      ),
    });

    act(() => {
      result.current(43);
    });

    expect(testAtom(store).get()).toBe(43);
  });

  it('should allow updating state with an updater', () => {
    const testAtom = atom(42);
    const store = makeStore();

    testAtom(store).get(); // Initialize

    const { result } = renderHook(() => useSetStanValue(testAtom), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <StanProvider store={store}>{children}</StanProvider>
      ),
    });

    act(() => {
      result.current(prev => prev + 1);
    });

    expect(testAtom(store).get()).toBe(43);
  });
});

describe('useStanRefresh', () => {
  it('should return a function that refreshes the state', () => {
    const mockSelectorFn = jest
      .fn()
      .mockReturnValueOnce(42)
      .mockReturnValueOnce(43)
      .mockReturnValueOnce(44);

    const testSelector = selector(mockSelectorFn);
    const store = makeStore();

    testSelector(store).get(); // Initialize

    expect(mockSelectorFn).toHaveBeenCalledTimes(1);

    testSelector(store).get();

    expect(mockSelectorFn).toHaveBeenCalledTimes(1);

    const { result } = renderHook(() => useStanRefresh(testSelector), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <StanProvider store={store}>{children}</StanProvider>
      ),
    });

    act(() => {
      result.current();
    });

    expect(mockSelectorFn).toHaveBeenCalledTimes(1);

    expect(testSelector(store).get()).toBe(43);

    expect(mockSelectorFn).toHaveBeenCalledTimes(2);

    testSelector(store).subscribe(jest.fn()); // Mount

    result.current();

    expect(mockSelectorFn).toHaveBeenCalledTimes(3);
    expect(testSelector(store).get()).toBe(44);
  });
});

describe('useStanReset', () => {
  it('should return a function that resets the state', () => {
    const testAtom = atom(42);
    const store = makeStore();

    testAtom(store).get(); // Initialize

    const { result } = renderHook(() => useStanReset(testAtom), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <StanProvider store={store}>{children}</StanProvider>
      ),
    });

    testAtom(store).set(43);

    result.current();

    expect(testAtom(store).get()).toBe(42);
  });
});

describe('useStanCallback', () => {
  it('should allow setting writable state', () => {
    const testAtom = atom(42);
    const store = makeStore();

    const { result } = renderHook(
      () =>
        useStanCallback(
          ({ set }) =>
            (val: number) =>
              set(testAtom, val),
        ),
      {
        wrapper: ({ children }: { children: ReactNode }) => (
          <StanProvider store={store}>{children}</StanProvider>
        ),
      },
    );

    act(() => {
      result.current(43);
    });

    expect(testAtom(store).get()).toBe(43);
  });

  it('should allow resetting writable state', () => {
    const testAtom = atom(42);
    const store = makeStore();

    testAtom(store).set(43); // Initialize with non-default value

    const { result } = renderHook(
      () =>
        useStanCallback(
          ({ reset }) =>
            () =>
              reset(testAtom),
        ),
      {
        wrapper: ({ children }: { children: ReactNode }) => (
          <StanProvider store={store}>{children}</StanProvider>
        ),
      },
    );

    act(() => {
      result.current();
    });

    expect(testAtom(store).get()).toBe(42);
  });

  it('should allow refreshing readonly state', () => {
    const mockFn = jest.fn().mockReturnValue(42);
    const testSelector = selector(mockFn);
    const store = makeStore();

    testSelector(store).get(); // Initialize
    testSelector(store).subscribe(() => {}); // Mount
    expect(mockFn).toHaveBeenCalledTimes(1);

    const { result } = renderHook(
      () =>
        useStanCallback(({ refresh }) => () => {
          refresh(testSelector);
        }),
      {
        wrapper: ({ children }: { children: ReactNode }) => (
          <StanProvider store={store}>{children}</StanProvider>
        ),
      },
    );

    act(() => {
      result.current();
    });

    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should support dependencies', () => {
    const testAtom = atom(42);
    const store = makeStore();

    const { result, rerender } = renderHook(
      ({ value }) =>
        useStanCallback(
          ({ set }) =>
            () => {
              set(testAtom, value);
            },
          [value],
        ),
      {
        initialProps: { value: 43 },
        wrapper: ({ children }: { children: ReactNode }) => (
          <StanProvider store={store}>{children}</StanProvider>
        ),
      },
    );

    act(() => {
      result.current();
    });

    expect(testAtom(store).get()).toBe(43);

    rerender({ value: 44 });

    act(() => {
      result.current();
    });

    expect(testAtom(store).get()).toBe(44);
  });

  it('should always use the latest callback implementation', () => {
    const testAtom = atom(42);
    const store = makeStore();

    const { result, rerender } = renderHook(
      ({ multiplier }) =>
        useStanCallback(({ set }) => (val: number) => {
          set(testAtom, val * multiplier);
        }),
      {
        initialProps: { multiplier: 2 },
        wrapper: ({ children }: { children: ReactNode }) => (
          <StanProvider store={store}>{children}</StanProvider>
        ),
      },
    );

    act(() => {
      result.current(10);
    });

    expect(testAtom(store).get()).toBe(20);

    rerender({ multiplier: 3 });

    act(() => {
      result.current(10);
    });

    expect(testAtom(store).get()).toBe(30);
  });

  it('should allow getting atom value', () => {
    const testAtom = atom(42);
    const store = makeStore();

    let capturedValue;
    const { result } = renderHook(
      () =>
        useStanCallback(({ get }) => () => {
          capturedValue = get(testAtom);
        }),
      {
        wrapper: ({ children }: { children: ReactNode }) => (
          <StanProvider store={store}>{children}</StanProvider>
        ),
      },
    );

    act(() => {
      result.current();
    });

    expect(capturedValue).toBe(42);
  });

  it('should allow getting synchronous selector value', () => {
    const testAtom = atom(42);
    const testSelector = selector(({ get }) => get(testAtom) * 2);
    const store = makeStore();

    let capturedValue;
    const { result } = renderHook(
      () =>
        useStanCallback(({ get }) => () => {
          capturedValue = get(testSelector);
        }),
      {
        wrapper: ({ children }: { children: ReactNode }) => (
          <StanProvider store={store}>{children}</StanProvider>
        ),
      },
    );

    act(() => {
      result.current();
    });

    expect(capturedValue).toBe(84);
  });

  it('should allow getting resolved asynchronous selector value', async () => {
    // eslint-disable-next-line @typescript-eslint/require-await
    const testSelector = selector(async () => 42);
    const store = makeStore();

    let capturedValue;
    const { result } = renderHook(
      () =>
        useStanCallback(({ get }) => async () => {
          capturedValue = await get(testSelector);
        }),
      {
        wrapper: ({ children }: { children: ReactNode }) => (
          <StanProvider store={store}>{children}</StanProvider>
        ),
      },
    );

    await act(async () => {
      await result.current();
    });

    expect(capturedValue).toBe(42);
  });

  it('should allow handling rejected asynchronous selector value', async () => {
    const error = new Error('Nope');
    // eslint-disable-next-line @typescript-eslint/require-await
    const testSelector = selector(async () => {
      throw error;
    });
    const store = makeStore();

    let capturedError;
    const { result } = renderHook(
      () =>
        useStanCallback(({ get }) => async () => {
          try {
            await get(testSelector);
          } catch (e) {
            capturedError = e;
          }
        }),
      {
        wrapper: ({ children }: { children: ReactNode }) => (
          <StanProvider store={store}>{children}</StanProvider>
        ),
      },
    );

    await act(async () => {
      await result.current();
    });

    expect(capturedError).toBe(error);
  });
});
