/**
 * @jest-environment jsdom
 */

import { renderHook, act, waitFor } from '@testing-library/react';

import { atom } from './atom';
import { selector } from './selector';
import {
  useStan,
  useStanValue,
  useStanValueAsync,
  useSetStanValue,
  useStanRefresher,
} from './react';

describe('useStan', () => {
  it('should initialize with the current state value', () => {
    const testAtom = atom(42);

    const { result } = renderHook(() => useStan(testAtom));

    expect(result.current[0]).toBe(42);
  });

  it('should propagate changes when setter is called with a new value', () => {
    const testAtom = atom(42);

    const { result } = renderHook(() => useStan(testAtom));

    act(() => {
      result.current[1](43);
    });

    expect(result.current[0]).toBe(43);
  });

  it('should propagate changes when setter is called with an updater', () => {
    const testAtom = atom(42);

    const { result } = renderHook(() => useStan(testAtom));

    act(() => {
      result.current[1](prev => prev + 1);
    });

    expect(result.current[0]).toBe(43);
  });

  it('should propagate changes when state is updated externally', () => {
    const testAtom = atom(42);

    const { result } = renderHook(() => useStan(testAtom));

    act(() => {
      testAtom.set(43);
    });

    expect(result.current[0]).toBe(43);
  });

  it('should maintain setter reference', () => {
    const testAtom = atom(42);

    const { result, rerender } = renderHook(() => useStan(testAtom));

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

    const { result } = renderHook(() => useStanValue(testAtom));

    expect(result.current).toBe(42);
  });

  it('should initialize with the current selector value', () => {
    const testSelector = selector(() => 42);

    const { result } = renderHook(() => useStanValue(testSelector));

    expect(result.current).toBe(42);
  });

  it('should initialize with the current async selector value', async () => {
    const testSelector = selector(async () => 42);

    const { result } = renderHook(() => useStanValue(testSelector));

    await expect(result.current).resolves.toBe(42);
  });

  it('should propagate changes', () => {
    const testAtom = atom(42);
    const testSelector = selector(({ get }) => get(testAtom) + 1);

    const { result, rerender } = renderHook(() => useStanValue(testSelector));

    act(() => {
      testAtom.set(43);
    });

    rerender();

    expect(result.current).toBe(44);
  });

  it('should unsubscribe on unmount', () => {
    const testAtom = atom(42);
    const mockUnsubscribe = jest.fn();

    jest.spyOn(testAtom, 'subscribe').mockReturnValueOnce(mockUnsubscribe);

    const { unmount } = renderHook(() => useStanValue(testAtom));

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });
});

describe('useStanValueAsync', () => {
  it('should handle success', async () => {
    const testSelector = selector(async () => 42);

    const { result } = renderHook(() => useStanValueAsync(testSelector));

    expect(result.current).toEqual({ type: 'loading' });

    await waitFor(() => {
      expect(result.current).toEqual({ type: 'ready', value: 42 });
    });
  });

  it('should handle error', async () => {
    const testSelector = selector(async () => {
      throw new Error('Nope');
    });

    const { result } = renderHook(() => useStanValueAsync(testSelector));

    expect(result.current).toEqual({ type: 'loading' });

    await waitFor(() => {
      expect(result.current).toEqual({ type: 'error', reason: 'Nope' });
    });
  });

  it('should handle unknown errors', async () => {
    const testSelector = selector(() => Promise.reject('🚗'));

    const { result } = renderHook(() => useStanValueAsync(testSelector));

    await waitFor(() => {
      expect(result.current).toEqual({ type: 'error', reason: 'unknown' });
    });
  });

  it('should handle changes in dependencies', async () => {
    const dep = atom(42);
    const testSelector = selector(async ({ get }) => get(dep));

    const { result } = renderHook(() => useStanValueAsync(testSelector));

    expect(result.current).toEqual({ type: 'loading' });

    await waitFor(() => {
      expect(result.current).toEqual({ type: 'ready', value: 42 });
    });

    act(() => {
      dep.set(43);
    });

    expect(result.current).toEqual({ type: 'loading' });

    await waitFor(() => {
      expect(result.current).toEqual({ type: 'ready', value: 43 });
    });
  });

  it('should unsubscribe on unmount', async () => {
    const testSelector = selector(async () => 42);
    const mockUnsubscribe = jest.fn();

    jest.spyOn(testSelector, 'subscribe').mockReturnValueOnce(mockUnsubscribe);

    const { unmount } = renderHook(() => useStanValue(testSelector));

    unmount();

    await act(() => Promise.resolve());

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });
});

describe('useSetStanValue', () => {
  it('should return the setter function from the state', () => {
    const testAtom = atom(42);
    const { result } = renderHook(() => useSetStanValue(testAtom));

    expect(result.current).toBe(testAtom.set);
  });

  it('should maintain setter reference across renders', () => {
    const testAtom = atom(42);
    const { result, rerender } = renderHook(() => useSetStanValue(testAtom));

    const prevSetter = result.current;

    rerender();

    expect(result.current).toBe(prevSetter);
  });

  it('should allow updating state with a new value', () => {
    const testAtom = atom(42);
    const { result } = renderHook(() => useSetStanValue(testAtom));

    act(() => {
      result.current(43);
    });

    expect(testAtom.get()).toBe(43);
  });

  it('should allow updating state with an updater', () => {
    const testAtom = atom(42);
    const { result } = renderHook(() => useSetStanValue(testAtom));

    act(() => {
      result.current(prev => prev + 1);
    });

    expect(testAtom.get()).toBe(43);
  });
});

describe('useStanRefresher', () => {
  it('should return a memoized callback that refreshes the state', () => {
    const mockSelectorFn = jest
      .fn()
      .mockReturnValueOnce(42)
      .mockReturnValueOnce(43)
      .mockReturnValueOnce(44);

    const testSelector = selector(mockSelectorFn);

    testSelector.get(); // Initialize

    expect(mockSelectorFn).toHaveBeenCalledTimes(1);

    testSelector.get();

    expect(mockSelectorFn).toHaveBeenCalledTimes(1);

    const { result } = renderHook(() => useStanRefresher(testSelector));

    act(() => {
      result.current();
    });

    expect(mockSelectorFn).toHaveBeenCalledTimes(1);

    expect(testSelector.get()).toBe(43);

    expect(mockSelectorFn).toHaveBeenCalledTimes(2);

    testSelector.subscribe(jest.fn()); // Mount

    act(() => {
      result.current();
    });

    expect(mockSelectorFn).toHaveBeenCalledTimes(3);
    expect(testSelector.get()).toBe(44);
  });
});
