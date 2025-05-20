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
});

describe.skip('TODO', () => {
  it('should create atoms with static initial value', () => {
    const family = atomFamily(42);
    const store = makeStore();

    const state1 = family({ id: 1 })(store);
    const state2 = family({ id: 2 })(store);

    expect(state1.get()).toBe(42);
    expect(state2.get()).toBe(42);
  });

  it('should create atoms with dynamic initial value based on parameter', () => {
    const family = atomFamily<number, { id: number }>(({ id }) => id * 2);
    const store = makeStore();

    const state1 = family({ id: 1 })(store);
    const state2 = family({ id: 2 })(store);

    expect(state1.get()).toBe(2);
    expect(state2.get()).toBe(4);
  });

  it('should return the same atom instance for identical parameters', () => {
    const family = atomFamily(42);
    const store = makeStore();

    const atom1 = family({ id: 1 })(store);
    const atom2 = family({ id: 1 })(store);

    expect(atom1).toBe(atom2);
  });

  it('should return different atom instances for different parameters', () => {
    const family = atomFamily(42);
    const store = makeStore();

    const state1 = family({ id: 1 })(store);
    const state2 = family({ id: 2 })(store);

    expect(state1).not.toBe(state2);
  });

  it('should maintain independent state for different parameters', () => {
    const family = atomFamily(42);
    const store = makeStore();

    const state1 = family({ id: 1 })(store);
    const state2 = family({ id: 2 })(store);

    state1.get(); // Initialize
    state2.get(); // Initialize

    state1.set(100);
    state2.set(200);

    expect(state1.get()).toBe(100);
    expect(state2.get()).toBe(200);
  });

  it('should handle effects for all atoms in the family', () => {
    const mockOnSet = jest.fn();
    const family = atomFamily(0, {
      effects: [
        ({ init, onSet }) => {
          init(42);
          onSet(mockOnSet);
        },
      ],
    });
    const store = makeStore();

    const state1 = family({ id: 1 })(store);
    state1.get(); // Initialize

    const state2 = family({ id: 2 })(store);
    state2.get(); // Initialize

    state2.set(prev => prev + 10);

    expect(state1.get()).toBe(42);
    expect(state2.get()).toBe(52);

    expect(mockOnSet).toHaveBeenCalledWith(52);
  });

  it('should handle primitive parameters', () => {
    const family = atomFamily<number, number>(id => id * 2);
    const store = makeStore();

    const state1 = family(1)(store);
    const state2 = family(2)(store);

    expect(state1.get()).toBe(2);
    expect(state2.get()).toBe(4);
  });

  it('should handle complex parameters', () => {
    const family = atomFamily<string, { user: { id: number; name: string } }>(
      param => param.user.name,
    );
    const store = makeStore();

    const state1 = family({ user: { id: 1, name: 'Alice' } })(store);
    const state2 = family({ user: { id: 2, name: 'Bob' } })(store);

    expect(state1.get()).toBe('Alice');
    expect(state2.get()).toBe('Bob');
  });
});
