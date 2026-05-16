import { makeStore } from './store';

const populateStore = (keys: string[]) => {
  const store = makeStore();

  keys.forEach((key, index) => {
    store.commit(key, index);
    store.markReady(key);
    store.mount(key);
    store.resetDeps(key);
  });

  return store;
};

describe('Store', () => {
  describe('destroy', () => {
    it('should clear all internal state', () => {
      const store = populateStore(['key-1', 'key-2']);

      store.destroy();

      expect(Array.from(store.entries())).toEqual([]);
      expect(store.has('key-1')).toBe(false);
      expect(store.has('key-2')).toBe(false);
      expect(store.versionOf('key-1')).toBe(0);
      expect(store.versionOf('key-2')).toBe(0);
      expect(store.isMounted('key-1')).toBe(false);
      expect(store.isMounted('key-2')).toBe(false);
      expect(store.isReady('key-1')).toBe(false);
      expect(store.isReady('key-2')).toBe(false);
      expect(store.trackDep('key-1', 'dep')).toBe(true);
    });
  });

  describe('erase', () => {
    it('should remove specific key from all internal state', () => {
      const key = 'test-key';
      const store = populateStore([key]);

      store.erase(key);

      expect(store.has(key)).toBe(false);
      expect(store.versionOf(key)).toBe(0);
      expect(store.isMounted(key)).toBe(false);
      expect(store.isReady(key)).toBe(false);
      expect(store.trackDep(key, 'dep')).toBe(true);
    });

    it('should only affect the specified key', () => {
      const key1 = 'key-1';
      const key2 = 'key-2';
      const store = populateStore([key1, key2]);

      store.erase(key1);

      expect(store.has(key1)).toBe(false);
      expect(store.has(key2)).toBe(true);
    });
  });

  describe('has / peek / seed / commit', () => {
    it('has returns false for missing keys', () => {
      const store = makeStore();

      expect(store.has('missing')).toBe(false);
    });

    it('seed writes a value without bumping the version', () => {
      const store = makeStore();

      store.seed('k', 42);

      expect(store.has('k')).toBe(true);
      expect(store.peek('k')).toBe(42);
      expect(store.versionOf('k')).toBe(0);
    });

    it('commit writes a value and bumps the version', () => {
      const store = makeStore();

      store.commit('k', 'hello');

      expect(store.peek('k')).toBe('hello');
      expect(store.versionOf('k')).toBe(1);
    });

    it('commit bumps the version on each call', () => {
      const store = makeStore();

      store.commit('k', 1);
      store.commit('k', 2);
      store.commit('k', 3);

      expect(store.peek('k')).toBe(3);
      expect(store.versionOf('k')).toBe(3);
    });

    it('seed after commit does not bump the version', () => {
      const store = makeStore();

      store.commit('k', 1);
      store.seed('k', 2);

      expect(store.peek('k')).toBe(2);
      expect(store.versionOf('k')).toBe(1);
    });
  });

  describe('versionOf', () => {
    it('returns 0 for missing keys', () => {
      const store = makeStore();

      expect(store.versionOf('missing')).toBe(0);
    });
  });

  describe('isReady / markReady / markStale', () => {
    it('isReady returns false by default', () => {
      const store = makeStore();

      expect(store.isReady('k')).toBe(false);
    });

    it('markReady sets ready=true', () => {
      const store = makeStore();

      store.markReady('k');

      expect(store.isReady('k')).toBe(true);
    });

    it('markStale unsets ready', () => {
      const store = makeStore();

      store.markReady('k');
      store.markStale('k');

      expect(store.isReady('k')).toBe(false);
    });
  });

  describe('isMounted / mount / unmount', () => {
    it('isMounted returns false by default', () => {
      const store = makeStore();

      expect(store.isMounted('k')).toBe(false);
    });

    it('mount sets mounted=true', () => {
      const store = makeStore();

      store.mount('k');

      expect(store.isMounted('k')).toBe(true);
    });

    it('unmount sets mounted=false', () => {
      const store = makeStore();

      store.mount('k');
      store.unmount('k');

      expect(store.isMounted('k')).toBe(false);
    });
  });

  describe('resetDeps / trackDep / depsChanged', () => {
    it('depsChanged returns false when no deps are tracked', () => {
      const store = makeStore();

      expect(store.depsChanged('k')).toBe(false);
    });

    it('trackDep returns true on first add and false on duplicate', () => {
      const store = makeStore();

      expect(store.trackDep('a', 'b')).toBe(true);
      expect(store.trackDep('a', 'b')).toBe(false);
    });

    it('depsChanged returns false when the dep version still matches', () => {
      const store = makeStore();

      store.commit('b', 1);
      store.trackDep('a', 'b');

      expect(store.depsChanged('a')).toBe(false);
    });

    it('depsChanged returns true when the dep version diverges', () => {
      const store = makeStore();

      store.commit('b', 1);
      store.trackDep('a', 'b');
      store.commit('b', 2);

      expect(store.depsChanged('a')).toBe(true);
    });

    it('depsChanged recurses into transitive deps', () => {
      const store = makeStore();

      store.commit('c', 1);
      store.trackDep('b', 'c');
      store.trackDep('a', 'b');

      expect(store.depsChanged('a')).toBe(false);

      store.commit('c', 2);

      expect(store.depsChanged('a')).toBe(true);
    });

    it('depsChanged tolerates a dep whose version was never set', () => {
      const store = makeStore();

      store.trackDep('a', 'b');

      expect(store.depsChanged('a')).toBe(false);
    });

    it('resetDeps clears recorded deps for a key', () => {
      const store = makeStore();

      store.commit('b', 1);
      store.trackDep('a', 'b');
      store.commit('b', 2);
      expect(store.depsChanged('a')).toBe(true);

      store.resetDeps('a');

      expect(store.depsChanged('a')).toBe(false);
    });

    it('resetDeps on a previously unseen key is a no-op', () => {
      const store = makeStore();

      store.resetDeps('a');

      expect(store.depsChanged('a')).toBe(false);
    });
  });

  describe('entries', () => {
    it('iterates over every committed and seeded value', () => {
      const store = makeStore();

      store.seed('a', 1);
      store.commit('b', 2);

      expect(Array.from(store.entries()).sort()).toEqual([
        ['a', 1],
        ['b', 2],
      ]);
    });

    it('reflects deletions performed via erase', () => {
      const store = makeStore();

      store.seed('a', 1);
      store.seed('b', 2);
      store.erase('a');

      expect(Array.from(store.entries())).toEqual([['b', 2]]);
    });
  });
});
