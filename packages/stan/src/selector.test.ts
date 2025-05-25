import { selector, selectorFamily } from './selector';
import { makeStore } from './store';
import { refresh } from './utils';
import { atom } from './atom';

describe('selector', () => {
  it('should compute state', () => {
    const state = selector(() => 42)(makeStore());

    expect(state.get()).toBe(42);
  });

  it('should compute async state', async () => {
    // eslint-disable-next-line @typescript-eslint/require-await
    const state = selector(async () => 42)(makeStore());

    await expect(state.get()).resolves.toBe(42);
  });

  it('should compute derived state', () => {
    const dep1 = atom(42);
    const dep2 = atom(43);
    const state = selector(({ get }) => get(dep1) + get(dep2))(makeStore());

    expect(state.get()).toBe(85);
  });

  it('should compute deep derived state', () => {
    const dep1 = atom(42);
    const dep2 = selector(({ get }) => get(dep1) + 1);
    const state = selector(({ get }) => get(dep2) + 1)(makeStore());

    expect(state.get()).toBe(44);
  });

  it('should compute async derived state', async () => {
    const dep1 = atom(42);
    const dep2 = atom(43);
    // eslint-disable-next-line @typescript-eslint/require-await
    const state = selector(async ({ get }) => get(dep1) + get(dep2))(
      makeStore(),
    );

    await expect(state.get()).resolves.toBe(85);
  });

  it('should compute deep async derived state', async () => {
    const dep1 = atom(42);
    // eslint-disable-next-line @typescript-eslint/require-await
    const dep2 = selector(async ({ get }) => get(dep1) + 1);
    const state = selector(async ({ get }) => (await get(dep2)) + 1)(
      makeStore(),
    );

    await expect(state.get()).resolves.toBe(44);
  });

  it('should update when deps change', () => {
    const dep1 = atom(42);
    const dep2 = atom(43);
    const store = makeStore();
    const evalCounter = jest.fn();
    const mockCallback = jest.fn();
    const state = selector(({ get }) => {
      evalCounter();
      return get(dep1) + get(dep2);
    })(store);

    state.get(); // Initialize
    state.subscribe(mockCallback);

    expect(evalCounter).toHaveBeenCalledTimes(1);

    dep1(store).set(42.5);

    expect(state.get()).toBe(85.5);
    expect(mockCallback).toHaveBeenCalledWith(85.5);
    expect(evalCounter).toHaveBeenCalledTimes(2);
  });

  it('should update when deep deps change', () => {
    const dep1 = atom(42);
    const dep2 = selector(({ get }) => get(dep1) + 1);
    const store = makeStore();
    const evalCounter = jest.fn();
    const mockCallback = jest.fn();
    const state = selector(({ get }) => {
      evalCounter();
      return get(dep2) + 1;
    })(store);

    state.get(); // Initialize
    state.subscribe(mockCallback);

    expect(evalCounter).toHaveBeenCalledTimes(1);

    dep1(store).set(42.5);

    expect(state.get()).toBe(44.5);
    expect(mockCallback).toHaveBeenCalledWith(44.5);
    expect(evalCounter).toHaveBeenCalledTimes(2);
  });

  it('should update when async deps change', async () => {
    const dep1 = atom(42);
    // eslint-disable-next-line @typescript-eslint/require-await
    const dep2 = selector(async ({ get }) => get(dep1));
    const store = makeStore();
    const evalCounter = jest.fn();
    const mockCallback = jest.fn();
    const state = selector(async ({ get }) => {
      evalCounter();
      return (await get(dep2)) + 1;
    })(store);

    await state.get(); // Initialize
    state.subscribe(mockCallback);

    expect(evalCounter).toHaveBeenCalledTimes(1);

    dep1(store).set(42.5);

    await expect(state.get()).resolves.toBe(43.5);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    await expect(mockCallback.mock.lastCall[0]).resolves.toBe(43.5);
    expect(evalCounter).toHaveBeenCalledTimes(2);
  });

  it('should not update immediately when deps change while unmounted', () => {
    const dep1 = atom(42);
    const dep2 = selector(({ get }) => get(dep1));
    const store = makeStore();
    const evalCounter = jest.fn();
    const mockCallback = jest.fn();
    const state = selector(({ get }) => {
      evalCounter();
      return get(dep2);
    })(store);

    state.get(); // Initialize

    expect(evalCounter).toHaveBeenCalledTimes(1);

    dep1(store).set(prev => prev + 1);

    expect(evalCounter).toHaveBeenCalledTimes(1);

    state.subscribe(mockCallback);

    dep1(store).set(prev => prev + 1);
    expect(state.get()).toBe(44);
    expect(evalCounter).toHaveBeenCalledTimes(2);
  });

  it('should cache result', () => {
    const dep = atom(42);
    const evalCounter = jest.fn();
    const state = selector(({ get }) => {
      evalCounter();
      return get(dep) + 1;
    })(makeStore());

    expect(state.get()).toBe(43);

    expect(evalCounter).toHaveBeenCalledTimes(1);

    expect(state.get()).toBe(43);

    expect(evalCounter).toHaveBeenCalledTimes(1);
  });

  it('should cache async result', async () => {
    const dep = atom(42);
    const evalCounter = jest.fn();
    // eslint-disable-next-line @typescript-eslint/require-await
    const state = selector(async ({ get }) => {
      evalCounter();
      return get(dep) + 1;
    })(makeStore());

    await expect(state.get()).resolves.toBe(43);

    expect(evalCounter).toHaveBeenCalledTimes(1);

    await expect(state.get()).resolves.toBe(43);

    expect(evalCounter).toHaveBeenCalledTimes(1);
  });

  it('should handle rejected promises', async () => {
    const dep = atom(42);
    const canFail = jest
      .fn()
      .mockImplementationOnce(() => {
        throw new Error('Nope');
      })
      .mockImplementationOnce(() => {});
    const evalCounter = jest.fn();
    // eslint-disable-next-line @typescript-eslint/require-await
    const state = selector(async ({ get }) => {
      evalCounter();
      canFail();
      return get(dep) + 1;
    })(makeStore());

    await expect(state.get()).rejects.toThrow('Nope');

    expect(evalCounter).toHaveBeenCalledTimes(1);

    await expect(state.get()).resolves.toBe(43);

    expect(evalCounter).toHaveBeenCalledTimes(2);

    await expect(state.get()).resolves.toBe(43);

    expect(evalCounter).toHaveBeenCalledTimes(2);
  });

  it('let one subscribe multiple times', () => {
    const dep = atom(42);
    const store = makeStore();
    const state = selector(({ get }) => get(dep))(store);
    const mockCallback1 = jest.fn();
    const mockCallback2 = jest.fn();

    state.get(); // Initialize
    state.subscribe(mockCallback1);
    state.subscribe(mockCallback2);

    dep(store).set(43);

    expect(mockCallback1).toHaveBeenCalledWith(43);
    expect(mockCallback2).toHaveBeenCalledWith(43);
  });

  it('should let one unsubscribe', () => {
    const dep = atom(42);
    const store = makeStore();
    const state = selector(({ get }) => get(dep))(store);
    const mockCallback = jest.fn();

    state.get(); // Initialize

    const unsubscribe = state.subscribe(mockCallback);

    dep(store).set(43);

    unsubscribe();

    dep(store).set(44);

    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith(43);
  });

  it('should re-evaluate when refreshed mounted', () => {
    const evalCounter = jest.fn();
    const mockCallback = jest.fn();
    const producer = jest
      .fn<number, []>()
      .mockReturnValueOnce(1)
      .mockReturnValueOnce(2);
    const state = selector(() => {
      evalCounter();
      return producer();
    })(makeStore());

    state.get(); // Initialize
    state.subscribe(mockCallback); // Mount

    expect(evalCounter).toHaveBeenCalledTimes(1);
    expect(mockCallback).not.toHaveBeenCalled();

    refresh(state);

    expect(evalCounter).toHaveBeenCalledTimes(2);
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it('should invalidate cache when refreshed unmounted', () => {
    const evalCounter = jest.fn();
    const producer = jest
      .fn<number, []>()
      .mockReturnValueOnce(1)
      .mockReturnValueOnce(2);
    const state = selector(() => {
      evalCounter();
      return producer();
    })(makeStore());

    state.get(); // Initialize

    expect(evalCounter).toHaveBeenCalledTimes(1);

    refresh(state);

    expect(evalCounter).toHaveBeenCalledTimes(1);

    state.get();

    expect(evalCounter).toHaveBeenCalledTimes(2);
  });

  it('should use referential equality by default', () => {
    const initialValue = { foo: 'bar' };
    const nextValue = structuredClone(initialValue);
    const producer = jest
      .fn<typeof initialValue, []>()
      .mockReturnValueOnce(initialValue)
      .mockReturnValueOnce(nextValue);

    const state = selector(() => producer())(makeStore());
    const mockCallback = jest.fn();

    state.get(); // Initialize
    state.subscribe(mockCallback);
    refresh(state);

    expect(state.get()).toBe(nextValue);
    expect(mockCallback).toHaveBeenCalledWith(nextValue);
  });

  it('should let one customize equality function', () => {
    const initialValue = { foo: 'bar' };
    const nextValue = structuredClone(initialValue);
    const producer = jest
      .fn<typeof initialValue, []>()
      .mockReturnValueOnce(initialValue)
      .mockReturnValueOnce(nextValue);

    const areValuesEqual = <T>(a: T, b: T) =>
      JSON.stringify(a) === JSON.stringify(b);

    const state = selector(() => producer(), { areValuesEqual })(makeStore());
    const mockCallback = jest.fn();

    state.get(); // Initialize
    state.subscribe(mockCallback);
    refresh(state);

    expect(state.get()).toBe(initialValue);
    expect(mockCallback).not.toHaveBeenCalled();
  });

  it('should invalidate cache if deps change while unmounted', () => {
    const dep1 = atom(42);
    const dep2 = selector(({ get }) => get(dep1) + 1);
    const store = makeStore();
    const evalCounter = jest.fn();
    const mockCallback = jest.fn();
    const state = selector(({ get }) => {
      evalCounter();
      return get(dep2) + 1;
    })(store);

    state.get(); // Initialize
    const unsubscribe = state.subscribe(mockCallback);

    expect(evalCounter).toHaveBeenCalledTimes(1);

    dep1(store).set(43);

    expect(state.get()).toBe(45);
    expect(evalCounter).toHaveBeenCalledTimes(2);
    expect(mockCallback).toHaveBeenCalledTimes(1);

    unsubscribe();

    dep1(store).set(44);
    expect(evalCounter).toHaveBeenCalledTimes(2);
    expect(mockCallback).toHaveBeenCalledTimes(1);

    expect(state.get()).toBe(46);
    expect(evalCounter).toHaveBeenCalledTimes(3);
  });

  it('should abort previous work', () => {
    const signals: AbortSignal[] = [];

    const dep = atom(42);
    const store = makeStore();

    const state = selector(({ get, signal }) => {
      signals.push(signal);
      return get(dep);
    })(store);

    state.get(); // Initialize
    state.subscribe(jest.fn());

    expect(signals[0].aborted).toBe(false);

    dep(store).set(43);

    expect(signals[0].aborted).toBe(true);
  });
});

describe('selectorFamily', () => {
  it('should return the same state for the same parameter', () => {
    const family = selectorFamily(() => () => 1);
    const store = makeStore();

    const state1 = family(1)(store);
    const state2 = family(1)(store);

    expect(state1).toBe(state2);

    const param = {};
    const state3 = family(param)(store);
    const state4 = family(param)(store);

    expect(state3).toBe(state4);
  });

  it('should return the same state for identical parameters', () => {
    const family = selectorFamily(() => () => 1);
    const store = makeStore();

    const state1 = family({ foo: 'bar' })(store);
    const state2 = family({ foo: 'bar' })(store);

    expect(state1).toBe(state2);
  });

  it('should return a different state for a different parameter', () => {
    const family = selectorFamily(() => () => 1);
    const store = makeStore();

    const state1 = family(1)(store);
    const state2 = family(2)(store);

    expect(state1).not.toBe(state2);

    const state3 = family({ foo: 'bar' })(store);
    const state4 = family({ bar: 'baz' })(store);

    expect(state3).not.toBe(state4);
  });

  it('should handle most-recent cache policy', () => {
    const family = selectorFamily<number, { multiplier: number }>(
      ({ multiplier }) =>
        () =>
          multiplier * 42,
      {
        cachePolicy: { type: 'most-recent' },
      },
    );
    const store = makeStore();

    const state1 = family({ multiplier: 2 })(store);

    expect(family({ multiplier: 2 })(store)).toBe(state1);

    const state2 = family({ multiplier: 3 })(store);

    expect(family({ multiplier: 3 })(store)).toBe(state2);
    expect(family({ multiplier: 2 })(store)).not.toBe(state1);
  });

  it('should handle LRU cache policy', () => {
    const family = selectorFamily<number, { multiplier: number }>(
      ({ multiplier }) =>
        () =>
          multiplier * 42,
      {
        cachePolicy: { type: 'lru', maxSize: 2 },
      },
    );
    const store = makeStore();

    const state1 = family({ multiplier: 2 })(store);
    const state2 = family({ multiplier: 3 })(store);

    expect(family({ multiplier: 2 })(store)).toBe(state1);
    expect(family({ multiplier: 3 })(store)).toBe(state2);

    const state3 = family({ multiplier: 4 })(store);

    expect(family({ multiplier: 4 })(store)).toBe(state3);
    expect(family({ multiplier: 2 })(store)).not.toBe(state1);
  });
});
