/* eslint-disable @typescript-eslint/unbound-method */
import type { SetterOrUpdater } from './types';
import { atom, atomFamily } from './atom';
import { makeStore } from './store';
import { reset } from './utils';

describe('atom', () => {
  it('should initialize with the provided value', () => {
    const state = atom(42)(makeStore());

    expect(state.get()).toBe(42);
  });

  it('should disallow updates when not initialized', () => {
    const state = atom(42)(makeStore());

    state.set(43);

    expect(state.get()).toBe(42);
  });

  it('should let one update value', () => {
    const state = atom(42)(makeStore());

    state.get(); // Initialize
    state.set(43);

    expect(state.get()).toBe(43);
  });

  it('should let one update value via updater', () => {
    const state = atom(42)(makeStore());

    state.get(); // Initialize
    state.set(prev => prev + 1);

    expect(state.get()).toBe(43);
  });

  it('should notify subscribers when value changes', () => {
    const state = atom(42)(makeStore());
    const mockCallback = jest.fn();

    state.get(); // Initialize
    state.subscribe(mockCallback);
    state.set(43);

    expect(mockCallback).toHaveBeenCalledWith(43);
  });

  it('should allow multiple subscribers', () => {
    const state = atom(42)(makeStore());
    const mockCallback1 = jest.fn();
    const mockCallback2 = jest.fn();

    state.get(); // Initialize
    state.subscribe(mockCallback1);
    state.subscribe(mockCallback2);
    state.set(43);

    expect(mockCallback1).toHaveBeenCalledWith(43);
    expect(mockCallback2).toHaveBeenCalledWith(43);
  });

  it('let one unsubscribe', () => {
    const state = atom(42)(makeStore());
    const mockCallback = jest.fn();

    state.get(); // Initialize

    const unsubscribe = state.subscribe(mockCallback);

    state.set(43);

    unsubscribe();

    state.set(44);

    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenLastCalledWith(43);
  });

  it('should use referential equality by default', () => {
    const initialValue = { foo: 'bar' };
    const nextValue = structuredClone(initialValue);
    const state = atom(initialValue)(makeStore());
    const mockCallback = jest.fn();

    state.get(); // Initialize
    state.subscribe(mockCallback);
    state.set(nextValue);

    expect(state.get()).toBe(nextValue);
    expect(mockCallback).toHaveBeenCalledWith(nextValue);
  });

  it('should let one customize equality function', () => {
    const initialValue = { foo: 'bar' };
    const nextValue = structuredClone(initialValue);

    const areValuesEqual = <T>(a: T, b: T) =>
      JSON.stringify(a) === JSON.stringify(b);

    const state = atom(initialValue, { areValuesEqual })(makeStore());
    const mockCallback = jest.fn();

    state.get(); // Initialize
    state.subscribe(mockCallback);
    state.set(nextValue);

    expect(state.get()).toBe(initialValue);
    expect(mockCallback).not.toHaveBeenCalled();
  });

  it('should go back to initial value when reset', () => {
    const state = atom(42)(makeStore());
    const mockCallback = jest.fn();

    state.get(); // Initialize
    state.set(43);
    state.subscribe(mockCallback);

    reset(state);

    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenLastCalledWith(42);
  });

  it('should let one initialize atom value from effects', () => {
    const mockOnSet = jest.fn();
    const state = atom(42, {
      effects: [
        ({ init, onSet }) => {
          init(43);
          onSet(mockOnSet);
        },
      ],
    })(makeStore());

    expect(state.get()).toBe(43);
    expect(mockOnSet).not.toHaveBeenCalled();
  });

  it('should ignore onInit calls after initialization', () => {
    let initFn: (value: number) => void = () => {};

    const state = atom(42, {
      effects: [
        ({ init }) => {
          initFn = init;
        },
      ],
    })(makeStore());

    state.get(); // Initialize

    initFn(43);

    expect(state.get()).toBe(42);
  });

  it('should execute effects in order', () => {
    const state = atom(42, {
      effects: [
        ({ init }) => {
          init(43);
        },
        ({ init }) => {
          init(44);
        },
      ],
    })(makeStore());

    expect(state.get()).toBe(44);
  });

  it('should let one modify the value from effects', () => {
    let setFn: SetterOrUpdater<number> = () => {};

    const state = atom(42, {
      effects: [
        ({ set }) => {
          setFn = set;
        },
      ],
    })(makeStore());

    const mockCallback = jest.fn();

    state.get(); // Initialize

    state.subscribe(mockCallback);

    setFn(43);

    expect(mockCallback).toHaveBeenCalledWith(43);
  });

  it('should let one subscribe to value changes from effects', () => {
    const mockOnSet = jest.fn();

    const state = atom(42, {
      effects: [
        ({ onSet }) => {
          onSet(mockOnSet);
        },
      ],
    })(makeStore());

    state.get(); // Initialize

    expect(mockOnSet).not.toHaveBeenCalled();

    state.set(43);

    expect(mockOnSet).toHaveBeenLastCalledWith(43);

    reset(state);

    expect(mockOnSet).toHaveBeenLastCalledWith(42);
  });

  it('should not have effects trigger themselves', () => {
    const innerCallback = jest.fn();
    const outerCallback = jest.fn();

    let setter: SetterOrUpdater<number> = () => {};

    const state = atom(42, {
      effects: [
        ({ onSet, set }) => {
          onSet(innerCallback);
          setter = set;
        },
      ],
    })(makeStore());

    state.get(); // Initialize

    state.subscribe(outerCallback);

    setter(43);

    expect(innerCallback).not.toHaveBeenCalled();
    expect(outerCallback).toHaveBeenCalledWith(43);
  });

  it('should scope state to store', () => {
    const store1 = makeStore();
    const store2 = makeStore();
    const scopedState = atom(42);

    expect(scopedState(store1)).toBe(scopedState(store1));
    expect(scopedState(store1)).not.toBe(scopedState(store2));
  });
});

describe('atomFamily', () => {
  it('should let one use static initial value', () => {
    const family = atomFamily(42);
    const store = makeStore();

    const state1 = family(1)(store);
    const state2 = family(2)(store);

    expect(state1.get()).toBe(42);
    expect(state2.get()).toBe(42);
  });

  it('should let one derive initial value from param', () => {
    const family = atomFamily<number, number>(param => param);
    const store = makeStore();

    const state1 = family(42)(store);
    const state2 = family(43)(store);

    expect(state1.get()).toBe(42);
    expect(state2.get()).toBe(43);
  });

  it('should return the same state for the same parameter', () => {
    const family = atomFamily(42);
    const store = makeStore();

    const atom1 = family(1)(store);
    const atom2 = family(1)(store);

    expect(atom1).toBe(atom2);

    const param = {};
    const atom3 = family(param)(store);
    const atom4 = family(param)(store);

    expect(atom3).toBe(atom4);
  });

  it('should return the same state for identical parameter', () => {
    const family = atomFamily(42);
    const store = makeStore();

    const atom1 = family({ foo: 'bar' })(store);
    const atom2 = family({ foo: 'bar' })(store);

    expect(atom1).toBe(atom2);
  });

  it('should return different state for different parameter', () => {
    const family = atomFamily(42);
    const store = makeStore();

    const state1 = family(1)(store);
    const state2 = family(2)(store);

    expect(state1).not.toBe(state2);

    const state3 = family({ foo: 'bar' })(store);
    const state4 = family({ bar: 'baz' })(store);

    expect(state3).not.toBe(state4);
  });

  it('should maintain independent state for different parameters', () => {
    const family = atomFamily(42);
    const store = makeStore();

    const state1 = family(1)(store);
    const state2 = family(2)(store);

    state1.get(); // Initialize
    state2.get(); // Initialize

    state1.set(43);
    state2.set(44);

    expect(state1.get()).toBe(43);
    expect(state2.get()).toBe(44);
  });

  it('should execute effects for every state', () => {
    const mockOnSet = jest.fn();
    const family = atomFamily(42, {
      effects: [
        ({ init, onSet }) => {
          init(43);
          onSet(mockOnSet);
        },
      ],
    });
    const store = makeStore();

    const state1 = family(1)(store);
    state1.get(); // Initialize

    const state2 = family(2)(store);
    state2.get(); // Initialize

    expect(state1.get()).toBe(43);
    expect(state2.get()).toBe(43);

    state1.set(44);

    expect(mockOnSet).toHaveBeenLastCalledWith(44);

    state2.set(45);

    expect(mockOnSet).toHaveBeenLastCalledWith(45);
  });
});
