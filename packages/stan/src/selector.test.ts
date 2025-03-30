import { selector, selectorFamily } from './selector';
import { atom } from './atom';
import { refresh } from './utils';

describe('selector', () => {
  it('should compute derived state', () => {
    const atom1 = atom(10);
    const atom2 = atom(20);
    const sum = selector(({ get }) => get(atom1) + get(atom2));

    expect(sum.get()).toBe(30);
  });

  it('should compute derived async state', async () => {
    const selector1 = selector(async () => 10);
    const selector2 = selector(async () => 20);
    const sum = selector(({ get }) =>
      Promise.all([get(selector1), get(selector2)]).then(deps =>
        deps.reduce((acc, curr) => acc + curr, 0),
      ),
    );

    expect(await sum.get()).toBe(30);
  });

  it('should update when dependencies change', () => {
    const atom1 = atom(10);
    const atom2 = atom(20);
    const sum = selector(({ get }) => get(atom1) + get(atom2));
    const mockCallback = jest.fn();

    sum.get(); // Initialize
    sum.subscribe(mockCallback);

    atom1.set(11);

    expect(sum.get()).toBe(31);
    expect(mockCallback).toHaveBeenCalledWith(31);
  });

  it('should support custom equality function', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const areValuesEqual = (a: any, b: any) => a.value === b.value;

    const dep = atom({ value: 42 });
    const double = selector(({ get }) => get(dep).value * 2, {
      areValuesEqual,
    });
    const mockCallback = jest.fn();

    double.get(); // Initialize
    double.subscribe(mockCallback);

    dep.set({ value: 42 });

    expect(mockCallback).not.toHaveBeenCalled();

    dep.set({ value: 43 });

    expect(mockCallback).toHaveBeenCalledWith(86);
  });

  it('should allow unsubscribing', () => {
    const dep = atom(42);
    const double = selector(({ get }) => get(dep) * 2);
    const mockCallback = jest.fn();

    double.get(); // Initialize

    const unsubscribe = double.subscribe(mockCallback);

    dep.set(43);

    unsubscribe();

    dep.set(44);

    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith(86);
  });

  it('should allow multiple subscribers', () => {
    const dep = atom(42);
    const double = selector(({ get }) => get(dep) * 2);
    const mockCallback1 = jest.fn();
    const mockCallback2 = jest.fn();

    double.get(); // Initialize
    double.subscribe(mockCallback1);
    double.subscribe(mockCallback2);

    dep.set(43);

    expect(mockCallback1).toHaveBeenCalledWith(86);
    expect(mockCallback2).toHaveBeenCalledWith(86);
  });

  it('should re-evaluate when refreshed', () => {
    const mockSelectorFn = jest
      .fn()
      .mockReturnValueOnce(42)
      .mockReturnValueOnce(43)
      .mockReturnValueOnce(44);
    const sel = selector(mockSelectorFn);
    const mockCallback = jest.fn();

    sel.get(); // Initialize

    expect(mockSelectorFn).toHaveBeenCalledTimes(1);

    const unsubscribe = sel.subscribe(mockCallback);

    refresh(sel);

    expect(mockSelectorFn).toHaveBeenCalledTimes(2);
    expect(mockCallback).toHaveBeenCalledWith(43);

    unsubscribe();

    refresh(sel);

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

    const selector1 = family({ multiplier: 2 });
    const selector2 = family({ multiplier: 3 });

    expect(selector1.get()).toBe(84);
    expect(selector2.get()).toBe(126);
  });

  it('should return the same selector instance for identical parameters', () => {
    const dep = atom(42);
    const family = selectorFamily<number, { multiplier: number }>(
      ({ multiplier }) =>
        ({ get }) =>
          get(dep) * multiplier,
    );

    const selector1 = family({ multiplier: 2 });
    const selector2 = family({ multiplier: 2 });

    expect(selector1).toBe(selector2);
  });

  it('should return different selector instances for different parameters', () => {
    const dep = atom(42);
    const family = selectorFamily<number, { multiplier: number }>(
      ({ multiplier }) =>
        ({ get }) =>
          get(dep) * multiplier,
    );

    const selector1 = family({ multiplier: 2 });
    const selector2 = family({ multiplier: 3 });

    expect(selector1).not.toBe(selector2);
  });

  it('should update when dependencies change', () => {
    const dep = atom(42);
    const family = selectorFamily<number, { multiplier: number }>(
      ({ multiplier }) =>
        ({ get }) =>
          get(dep) * multiplier,
    );

    const selector1 = family({ multiplier: 2 });
    const selector2 = family({ multiplier: 3 });
    const mockCallback1 = jest.fn();
    const mockCallback2 = jest.fn();

    selector1.get(); // Initialize
    selector2.get(); // Initialize
    selector1.subscribe(mockCallback1);
    selector2.subscribe(mockCallback2);

    dep.set(43);

    expect(selector1.get()).toBe(86);
    expect(selector2.get()).toBe(129);
    expect(mockCallback1).toHaveBeenCalledWith(86);
    expect(mockCallback2).toHaveBeenCalledWith(129);
  });

  it('should support custom equality function', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const areValuesEqual = (a: any, b: any) => a % 2 === b % 2;

    const dep = atom(42);
    const family = selectorFamily<number, { multiplier: number }>(
      ({ multiplier }) =>
        ({ get }) =>
          get(dep) * multiplier,
      { areValuesEqual },
    );

    const sel = family({ multiplier: 2 });
    const mockCallback = jest.fn();

    sel.get(); // Initialize
    sel.subscribe(mockCallback);

    dep.set(44);

    expect(mockCallback).not.toHaveBeenCalled();

    dep.set(43);

    expect(mockCallback).toHaveBeenCalledWith(86);
  });

  it('should handle primitive parameters', () => {
    const dep = atom(42);
    const family = selectorFamily<number, number>(
      multiplier =>
        ({ get }) =>
          get(dep) * multiplier,
    );

    const selector1 = family(2);
    const selector2 = family(3);

    expect(selector1.get()).toBe(84);
    expect(selector2.get()).toBe(126);
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

    const selector1 = family({ user: { id: 1, multiplier: 2 } });
    const selector2 = family({ user: { id: 2, multiplier: 3 } });

    expect(selector1.get()).toBe(84);
    expect(selector2.get()).toBe(126);
  });

  it('should support most-recent cache policy', () => {
    const family = selectorFamily<number, { multiplier: number }>(
      ({ multiplier }) =>
        () =>
          multiplier * 42,
      {
        cachePolicy: { type: 'most-recent' },
      },
    );

    const selector1 = family({ multiplier: 2 });

    expect(family({ multiplier: 2 })).toBe(selector1);

    const selector2 = family({ multiplier: 3 });

    expect(family({ multiplier: 3 })).toBe(selector2);
    expect(family({ multiplier: 2 })).not.toBe(selector1);
  });

  it('should support LRU cache policy', () => {
    const family = selectorFamily<number, { multiplier: number }>(
      ({ multiplier }) =>
        () =>
          multiplier * 42,
      {
        cachePolicy: { type: 'lru', maxSize: 2 },
      },
    );

    const selector1 = family({ multiplier: 2 });
    const selector2 = family({ multiplier: 3 });

    expect(family({ multiplier: 2 })).toBe(selector1);
    expect(family({ multiplier: 3 })).toBe(selector2);

    const selector3 = family({ multiplier: 4 });

    expect(family({ multiplier: 4 })).toBe(selector3);
    expect(family({ multiplier: 2 })).not.toBe(selector1);
  });

  /*
  it('should support different cache policies', () => {
    const family = selectorFamily<number, { multiplier: number }>(
      ({ multiplier }) =>
        () =>
          multiplier * 42,
      { cachePolicy: { type: 'lru', maxSize: 2 } },
    );

    const selector1 = family({ multiplier: 2 });
    const selector2 = family({ multiplier: 3 });
    const selector3 = family({ multiplier: 4 });

    // First two selectors should be cached
    expect(selector1.get()).toBe(84);
    expect(selector2.get()).toBe(126);
    expect(selector3.get()).toBe(168);

    // Accessing selector1 again should keep it in cache
    selector1.get();
    const selector4 = family({ multiplier: 5 });
    expect(selector4.get()).toBe(210);

    // selector2 should be evicted from cache
    const selector2Again = family({ multiplier: 3 });
    expect(selector2Again).not.toBe(selector2);
  });
  */
});
