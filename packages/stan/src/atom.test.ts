import type { SetterOrUpdater } from './state';
import { atom, atomFamily } from './atom';

describe('atom', () => {
  it('should initialize with the provided value', () => {
    const testAtom = atom(42);

    expect(testAtom.get()).toBe(42);
  });

  it('should update value when set is called with a new value', () => {
    const testAtom = atom(42);

    testAtom.set(100);

    expect(testAtom.get()).toBe(100);
  });

  it('should support updater function in set', () => {
    const testAtom = atom(42);

    testAtom.set(prev => prev + 10);

    expect(testAtom.get()).toBe(52);
  });

  it('should notify subscribers when value changes', () => {
    const testAtom = atom(42);
    const mockCallback = jest.fn();

    testAtom.subscribe(mockCallback);
    testAtom.set(100);

    expect(mockCallback).toHaveBeenCalledWith(100);
  });

  it('should allow multiple subscribers', () => {
    const testAtom = atom(42);
    const mockCallback1 = jest.fn();
    const mockCallback2 = jest.fn();

    testAtom.subscribe(mockCallback1);
    testAtom.subscribe(mockCallback2);
    testAtom.set(100);

    expect(mockCallback1).toHaveBeenCalledWith(100);
    expect(mockCallback2).toHaveBeenCalledWith(100);
  });

  it('should allow unsubscribing', () => {
    const testAtom = atom(42);
    const mockCallback = jest.fn();

    const unsubscribe = testAtom.subscribe(mockCallback);

    testAtom.set(100);

    unsubscribe();

    testAtom.set(200);

    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith(100);
  });

  it('should allow initializing atom value', () => {
    const mockOnSet = jest.fn();
    const testAtom = atom(0, {
      effects: [
        ({ init, onSet }) => {
          init(42);
          onSet(mockOnSet);
        },
      ],
    });

    expect(testAtom.get()).toBe(42);
    expect(mockOnSet).not.toHaveBeenCalled();
  });

  it('should only allow synchronous initialization', done => {
    let initFn: (value: number) => void;

    const testAtom = atom(0, {
      effects: [
        ({ init }) => {
          initFn = init;
        },
      ],
    });

    setTimeout(() => {
      initFn(42);

      try {
        expect(testAtom.get()).toBe(0);
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  it('should respect initialization order', () => {
    const testAtom = atom(0, {
      effects: [
        ({ init }) => {
          init(Math.PI);
        },
        ({ init }) => {
          init(42);
        },
      ],
    });

    expect(testAtom.get()).toBe(42);
  });

  it('should let effects modify atom value', done => {
    let setFn: SetterOrUpdater<number>;

    const testAtom = atom(0, {
      effects: [
        ({ set }) => {
          setFn = set;
        },
      ],
    });

    const mockCallback = jest.fn();

    testAtom.subscribe(mockCallback);

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

    const testAtom = atom(0, {
      effects: [
        ({ onSet }) => {
          onSet(mockOnSet1);
        },
        ({ onSet }) => {
          onSet(mockOnSet2);
        },
      ],
    });

    setTimeout(() => {
      testAtom.set(42);

      try {
        expect(mockOnSet1).toHaveBeenCalledWith(42);
        expect(mockOnSet2).toHaveBeenCalledWith(42);
        done();
      } catch (err) {
        done(err);
      }
    });
  });
});

describe('atomFamily', () => {
  it('should create atoms with static initial value', () => {
    const family = atomFamily(42);
    const atom1 = family({ id: 1 });
    const atom2 = family({ id: 2 });

    expect(atom1.get()).toBe(42);
    expect(atom2.get()).toBe(42);
  });

  it('should create atoms with dynamic initial value based on parameter', () => {
    const family = atomFamily<number, { id: number }>(({ id }) => id * 2);
    const atom1 = family({ id: 1 });
    const atom2 = family({ id: 2 });

    expect(atom1.get()).toBe(2);
    expect(atom2.get()).toBe(4);
  });

  it('should return the same atom instance for identical parameters', () => {
    const family = atomFamily(42);
    const atom1 = family({ id: 1 });
    const atom2 = family({ id: 1 });

    expect(atom1).toBe(atom2);
  });

  it('should return different atom instances for different parameters', () => {
    const family = atomFamily(42);
    const atom1 = family({ id: 1 });
    const atom2 = family({ id: 2 });

    expect(atom1).not.toBe(atom2);
  });

  it('should maintain independent state for different parameters', () => {
    const family = atomFamily(42);
    const atom1 = family({ id: 1 });
    const atom2 = family({ id: 2 });

    atom1.set(100);
    atom2.set(200);

    expect(atom1.get()).toBe(100);
    expect(atom2.get()).toBe(200);
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

    const atom1 = family({ id: 1 });
    const atom2 = family({ id: 2 });

    atom2.set(prev => prev + 10);

    expect(atom1.get()).toBe(42);
    expect(atom2.get()).toBe(52);

    expect(mockOnSet).toHaveBeenCalledWith(52);
  });

  it('should handle primitive parameters', () => {
    const family = atomFamily<number, number>(id => id * 2);
    const atom1 = family(1);
    const atom2 = family(2);

    expect(atom1.get()).toBe(2);
    expect(atom2.get()).toBe(4);
  });

  it('should handle complex parameters', () => {
    const family = atomFamily<string, { user: { id: number; name: string } }>(
      param => param.user.name,
    );
    const atom1 = family({ user: { id: 1, name: 'Alice' } });
    const atom2 = family({ user: { id: 2, name: 'Bob' } });

    expect(atom1.get()).toBe('Alice');
    expect(atom2.get()).toBe('Bob');
  });
});
