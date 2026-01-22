import { makeStore } from './store';

const populateStore = (keys: string[]) => {
  const store = makeStore();

  keys.forEach((key, index) => {
    store.value.set(key, index);
    store.version.set(key, 1);
    store.initialized.set(key, true);
    store.mounted.set(key, true);
    store.deps.set(key, new Map());
  });

  return store;
};

describe('Store', () => {
  describe('destroy', () => {
    it('should clear all internal maps', () => {
      const store = populateStore(['key-1', 'key-2']);

      store.destroy();

      expect(store.value.size).toBe(0);
      expect(store.version.size).toBe(0);
      expect(store.mounted.size).toBe(0);
      expect(store.initialized.size).toBe(0);
      expect(store.deps.size).toBe(0);
    });
  });

  describe('erase', () => {
    it('should remove specific key from all internal maps', () => {
      const key = 'test-key';
      const store = populateStore([key]);

      store.erase(key);

      expect(store.value.has(key)).toBe(false);
      expect(store.version.has(key)).toBe(false);
      expect(store.mounted.has(key)).toBe(false);
      expect(store.initialized.has(key)).toBe(false);
      expect(store.deps.has(key)).toBe(false);
    });

    it('should only affect the specified key', () => {
      const key1 = 'key-1';
      const key2 = 'key-2';
      const store = populateStore([key1, key2]);

      store.erase(key1);

      expect(store.value.has(key1)).toBe(false);
      expect(store.value.has(key2)).toBe(true);
    });
  });
});
