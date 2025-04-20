import { selector, selectorFamily } from './selector';
import { makeStore } from './store';
import { refresh } from './utils';
import { atom } from './atom';

describe('selector', () => {
  it('should compute derived state', () => {
    const atom1 = atom(10);
    const atom2 = atom(20);
    const sum = selector(({ get }) => get(atom1) + get(atom2))(makeStore());

    expect(sum.get()).toBe(30);
  });

  it('should compute derived async state', async () => {
    const selector1 = selector(async () => 10);
    const selector2 = selector(async () => 20);
    const sum = selector(({ get }) =>
      Promise.all([get(selector1), get(selector2)]).then(deps =>
        deps.reduce((acc, curr) => acc + curr, 0),
      ),
    )(makeStore());

    expect(await sum.get()).toBe(30);
  });

  it('should update when dependencies change', () => {
    const atom1 = atom(10);
    const atom2 = atom(20);
    const store = makeStore();
    const sum = selector(({ get }) => get(atom1) + get(atom2))(store);
    const mockCallback = jest.fn();

    sum.get(); // Initialize
    sum.subscribe(mockCallback);

    atom1(store).set(11);

    expect(sum.get()).toBe(31);
    expect(mockCallback).toHaveBeenCalledWith(31);
  });

  it('should handle custom equality function', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const areValuesEqual = (a: any, b: any) => a.value === b.value;

    const dep = atom({ value: 42 });
    const store = makeStore();
    const double = selector(({ get }) => get(dep).value * 2, {
      areValuesEqual,
    })(store);
    const mockCallback = jest.fn();

    double.get(); // Initialize
    double.subscribe(mockCallback);

    dep(store).set({ value: 42 });

    expect(mockCallback).not.toHaveBeenCalled();

    dep(store).set({ value: 43 });

    expect(mockCallback).toHaveBeenCalledWith(86);
  });

  it('should allow unsubscribing', () => {
    const dep = atom(42);
    const store = makeStore();
    const double = selector(({ get }) => get(dep) * 2)(store);
    const mockCallback = jest.fn();

    double.get(); // Initialize

    const unsubscribe = double.subscribe(mockCallback);

    dep(store).set(43);

    unsubscribe();

    dep(store).set(44);

    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith(86);
  });

  it('should allow multiple subscribers', () => {
    const dep = atom(42);
    const store = makeStore();
    const double = selector(({ get }) => get(dep) * 2)(store);
    const mockCallback1 = jest.fn();
    const mockCallback2 = jest.fn();

    double.get(); // Initialize
    double.subscribe(mockCallback1);
    double.subscribe(mockCallback2);

    dep(store).set(43);

    expect(mockCallback1).toHaveBeenCalledWith(86);
    expect(mockCallback2).toHaveBeenCalledWith(86);
  });

  it('should re-evaluate when refreshed', () => {
    const mockSelectorFn = jest
      .fn()
      .mockReturnValueOnce(42)
      .mockReturnValueOnce(43)
      .mockReturnValueOnce(44);
    const state = selector(mockSelectorFn)(makeStore());
    const mockCallback = jest.fn();

    state.get(); // Initialize

    expect(mockSelectorFn).toHaveBeenCalledTimes(1);

    const unsubscribe = state.subscribe(mockCallback);

    refresh(state);

    expect(mockSelectorFn).toHaveBeenCalledTimes(2);
    expect(mockCallback).toHaveBeenCalledWith(43);

    unsubscribe();

    refresh(state);

    expect(mockSelectorFn).toHaveBeenCalledTimes(2);
  });

  it('should not cache errors', async () => {
    const mockSelectorFn = jest
      .fn()
      .mockRejectedValueOnce(new Error('Nope'))
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1);

    const state = selector(mockSelectorFn)(makeStore());

    state.get();

    expect(mockSelectorFn).toHaveBeenCalledTimes(1);

    await Promise.resolve();

    state.get();

    expect(mockSelectorFn).toHaveBeenCalledTimes(2);

    await Promise.resolve();

    state.get();

    expect(mockSelectorFn).toHaveBeenCalledTimes(2);
  });
});

describe('selectorFamily', () => {
  it('should create selectors with static computation', () => {
    const dep = atom(42);
    const family = selectorFamily<number, { multiplier: number }>(
      ({ multiplier }) =>
        ({ get }) =>
          get(dep) * multiplier,
    );

    const store = makeStore();
    const state1 = family({ multiplier: 2 })(store);
    const state2 = family({ multiplier: 3 })(store);

    expect(state1.get()).toBe(84);
    expect(state2.get()).toBe(126);
  });

  it('should return the same selector instance for identical parameters', () => {
    const dep = atom(42);
    const family = selectorFamily<number, { multiplier: number }>(
      ({ multiplier }) =>
        ({ get }) =>
          get(dep) * multiplier,
    );

    const store = makeStore();
    const state1 = family({ multiplier: 2 })(store);
    const state2 = family({ multiplier: 2 })(store);

    expect(state1).toBe(state2);
  });

  it('should return different selector instances for different parameters', () => {
    const dep = atom(42);
    const family = selectorFamily<number, { multiplier: number }>(
      ({ multiplier }) =>
        ({ get }) =>
          get(dep) * multiplier,
    );

    const store = makeStore();
    const state1 = family({ multiplier: 2 })(store);
    const state2 = family({ multiplier: 3 })(store);

    expect(state1).not.toBe(state2);
  });

  it('should update when dependencies change', () => {
    const dep = atom(42);
    const family = selectorFamily<number, { multiplier: number }>(
      ({ multiplier }) =>
        ({ get }) =>
          get(dep) * multiplier,
    );

    const store = makeStore();
    const state1 = family({ multiplier: 2 })(store);
    const state2 = family({ multiplier: 3 })(store);
    const mockCallback1 = jest.fn();
    const mockCallback2 = jest.fn();

    state1.get(); // Initialize
    state2.get(); // Initialize
    state1.subscribe(mockCallback1);
    state2.subscribe(mockCallback2);

    dep(store).set(43);

    expect(state1.get()).toBe(86);
    expect(state2.get()).toBe(129);
    expect(mockCallback1).toHaveBeenCalledWith(86);
    expect(mockCallback2).toHaveBeenCalledWith(129);
  });

  it('should handle custom equality function', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const areValuesEqual = (a: any, b: any) => a % 2 === b % 2;

    const dep = atom(42);
    const family = selectorFamily<number, { multiplier: number }>(
      ({ multiplier }) =>
        ({ get }) =>
          get(dep) * multiplier,
      { areValuesEqual },
    );

    const store = makeStore();
    const state = family({ multiplier: 2 })(store);
    const mockCallback = jest.fn();

    state.get(); // Initialize
    state.subscribe(mockCallback);

    dep(store).set(44);

    expect(mockCallback).not.toHaveBeenCalled();

    dep(store).set(43);

    expect(mockCallback).toHaveBeenCalledWith(86);
  });

  it('should handle primitive parameters', () => {
    const dep = atom(42);
    const family = selectorFamily<number, number>(
      multiplier =>
        ({ get }) =>
          get(dep) * multiplier,
    );

    const store = makeStore();
    const state1 = family(2)(store);
    const state2 = family(3)(store);

    expect(state1.get()).toBe(84);
    expect(state2.get()).toBe(126);
  });

  it('should handle complex parameters', () => {
    const dep = atom(42);
    const family = selectorFamily<
      number,
      { user: { id: number; multiplier: number } }
    >(
      ({ user }) =>
        ({ get }) =>
          get(dep) * user.multiplier,
    );

    const store = makeStore();
    const state1 = family({ user: { id: 1, multiplier: 2 } })(store);
    const state2 = family({ user: { id: 2, multiplier: 3 } })(store);

    expect(state1.get()).toBe(84);
    expect(state2.get()).toBe(126);
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

  it('should not cache errors', async () => {
    const mockSelectorFn = jest
      .fn()
      .mockResolvedValueOnce(1)
      .mockRejectedValueOnce(new Error('Nope'))
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2);

    const mockSelectorFamilyFn = jest.fn().mockReturnValue(mockSelectorFn);

    const family = selectorFamily(mockSelectorFamilyFn);
    const store = makeStore();

    family(1)(store).get();

    expect(mockSelectorFn).toHaveBeenCalledTimes(1);

    family(2)(store).get();

    expect(mockSelectorFn).toHaveBeenCalledTimes(2);

    await Promise.resolve();

    family(1)(store).get();

    expect(mockSelectorFn).toHaveBeenCalledTimes(2);

    family(2)(store).get();

    expect(mockSelectorFn).toHaveBeenCalledTimes(3);
  });
});

it('should abort previous evaluation', () => {
  const signals: AbortSignal[] = [];

  const dep = atom(42);
  const store = makeStore();

  const state = selector(async ({ get, signal }) => {
    signals.push(signal);
    return get(dep);
  })(store);

  state.get(); // Initialize

  expect(signals[0].aborted).toBe(false);

  dep(store).set(43);

  expect(signals[0].aborted).toBe(true);
});
