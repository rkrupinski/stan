/**
 * @jest-environment jsdom
 */
import type { ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';

import { selector } from './selector';
import { makeStore } from './store';
import { atom } from './atom';
import {
  useStan,
  useStanValue,
  useStanValueAsync,
  useSetStanValue,
  useStanRefresh,
  useStanReset,
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
});

describe('useStanValueAsync', () => {
  it('should handle success', async () => {
    // eslint-disable-next-line @typescript-eslint/require-await
    const testSelector = selector(async () => 42);

    const { result } = renderHook(() => useStanValueAsync(testSelector), {
      wrapper: StanProvider,
    });

    expect(result.current).toEqual({ type: 'loading' });

    await waitFor(() => {
      expect(result.current).toEqual({ type: 'ready', value: 42 });
    });
  });

  it('should handle error', async () => {
    // eslint-disable-next-line @typescript-eslint/require-await
    const testSelector = selector(async () => {
      throw new Error('Nope');
    });

    const { result } = renderHook(() => useStanValueAsync(testSelector), {
      wrapper: StanProvider,
    });

    expect(result.current).toEqual({ type: 'loading' });

    await waitFor(() => {
      expect(result.current).toEqual({ type: 'error', reason: 'Nope' });
    });
  });

  it('should handle unknown errors', async () => {
    // eslint-disable-next-line @typescript-eslint/require-await
    const testSelector = selector(async () => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw '🚗';
    });

    const { result } = renderHook(() => useStanValueAsync(testSelector), {
      wrapper: StanProvider,
    });

    await waitFor(() => {
      expect(result.current).toEqual({ type: 'error', reason: 'unknown' });
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
  it('should return the setter function from the state', () => {
    const testAtom = atom(42);
    const store = makeStore();

    const { result } = renderHook(() => useSetStanValue(testAtom), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <StanProvider store={store}>{children}</StanProvider>
      ),
    });

    expect(result.current).toBe(testAtom(store).set);
  });

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
