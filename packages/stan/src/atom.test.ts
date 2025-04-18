import type { SetterOrUpdater } from './state';
import { atom, atomFamily } from './atom';
import { makeStore } from './store';

describe('atom', () => {
  it('should initialize with the provided value', () => {
    const state = atom(42)(makeStore());

    expect(state.get()).toBe(42);
  });

  it('should update value when set is called with a new value', () => {
    const state = atom(42)(makeStore());

    state.get(); // Initialize
    state.set(100);

    expect(state.get()).toBe(100);
  });

  it('should handle updater function in set', () => {
    const state = atom(42)(makeStore());

    state.get(); // Initialize
    state.set(prev => prev + 10);

    expect(state.get()).toBe(52);
  });

  it('should notify subscribers when value changes', () => {
    const state = atom(42)(makeStore());
    const mockCallback = jest.fn();

    state.get(); // Initialize
    state.subscribe(mockCallback);
    state.set(100);

    expect(mockCallback).toHaveBeenCalledWith(100);
  });

  it('should allow multiple subscribers', () => {
    const state = atom(42)(makeStore());
    const mockCallback1 = jest.fn();
    const mockCallback2 = jest.fn();

    state.get(); // Initialize
    state.subscribe(mockCallback1);
    state.subscribe(mockCallback2);
    state.set(100);

    expect(mockCallback1).toHaveBeenCalledWith(100);
    expect(mockCallback2).toHaveBeenCalledWith(100);
  });

  it('should allow unsubscribing', () => {
    const state = atom(42)(makeStore());
    const mockCallback = jest.fn();

    state.get(); // Initialize

    const unsubscribe = state.subscribe(mockCallback);

    state.set(100);

    unsubscribe();

    state.set(200);

    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith(100);
  });

  it('should allow initializing atom value from effects', () => {
    const mockOnSet = jest.fn();
    const state = atom(0, {
      effects: [
        ({ init, onSet }) => {
          init(42);
          onSet(mockOnSet);
        },
      ],
    })(makeStore());

    expect(state.get()).toBe(42);
    expect(mockOnSet).not.toHaveBeenCalled();
  });

  it('should only allow synchronous initialization from effects', done => {
    let initFn: (value: number) => void;

    const state = atom(0, {
      effects: [
        ({ init }) => {
          initFn = init;
        },
      ],
    })(makeStore());

    state.get(); // Initialize

    setTimeout(() => {
      initFn(42);

      try {
        expect(state.get()).toBe(0);
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  it('should respect effect order when initializing atom value', () => {
    const state = atom(0, {
      effects: [
        ({ init }) => {
          init(Math.PI);
        },
        ({ init }) => {
          init(42);
        },
      ],
    })(makeStore());

    expect(state.get()).toBe(42);
  });

  it('should let effects modify atom value', done => {
    let setFn: SetterOrUpdater<number>;

    const state = atom(0, {
      effects: [
        ({ set }) => {
          setFn = set;
        },
      ],
    })(makeStore());

    const mockCallback = jest.fn();

    state.get(); // Initialize

    state.subscribe(mockCallback);

    setTimeout(() => {
      setFn(42);

      try {
        expect(mockCallback).toHaveBeenCalledWith(42);
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  it('should let effects subscribe to value changes', done => {
    const mockOnSet1 = jest.fn();
    const mockOnSet2 = jest.fn();

    const state = atom(0, {
      effects: [
        ({ onSet }) => {
          onSet(mockOnSet1);
        },
        ({ onSet }) => {
          onSet(mockOnSet2);
        },
      ],
    })(makeStore());

    state.get(); // Initialize

    setTimeout(() => {
      state.set(42);

      try {
        expect(mockOnSet1).toHaveBeenCalledWith(42);
        expect(mockOnSet2).toHaveBeenCalledWith(42);
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  it('should not have effects trigger themselves', () => {
    const innerCallback = jest.fn();
    const outerCallback = jest.fn();

    let setter: SetterOrUpdater<number> | null = null;

    const state = atom(0, {
      effects: [
        ({ onSet, set }) => {
          onSet(innerCallback);
          setter = set;
        },
      ],
    })(makeStore());

    state.get(); // Initialize

    state.subscribe(outerCallback);

    (setter ?? jest.fn())(42);

    expect(innerCallback).not.toHaveBeenCalled();
    expect(outerCallback).toHaveBeenCalledWith(42);
  });
});

describe('atomFamily', () => {
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

  it('should support effects for all atoms in the family', () => {
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
