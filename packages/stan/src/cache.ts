import { identity } from './internal';

type CacheEntry<V> = {
  value: V;
  controller: AbortController;
};

type Evictable<T> = (signal: AbortSignal) => T;

interface Cache<K, V> {
  has(key: K): boolean;
  get(key: K): V | undefined;
  set(key: K, value: Evictable<V>): void;
  delete(key: K): boolean;
  clear(): void;
  retain(key: K): void;
  release(key: K): void;
}

class LRUCache<K, V> implements Cache<K, V> {
  #cache: Map<K, CacheEntry<V>>;
  #refCounts: Map<K, number>;
  #maxSize: number;

  constructor(maxSize: number) {
    this.#cache = new Map();
    this.#refCounts = new Map();
    this.#maxSize = maxSize;
  }

  #dispose(key: K) {
    const entry = this.#cache.get(key);
    if (entry) {
      entry.controller.abort();
      this.#cache.delete(key);
      this.#refCounts.delete(key);
    }
  }

  #evict(): void {
    for (const key of this.#cache.keys()) {
      if ((this.#refCounts.get(key) ?? 0) > 0) {
        continue;
      }

      this.#dispose(key);
      return;
    }
  }

  has(key: K) {
    return this.#cache.has(key);
  }

  get(key: K) {
    const entry = this.#cache.get(key);

    if (!entry) return undefined;

    // Refresh LRU order
    this.#cache.delete(key);
    this.#cache.set(key, entry);

    return entry.value;
  }

  set(key: K, value: Evictable<V>) {
    if (this.#cache.has(key)) {
      this.#dispose(key);
    } else if (this.#cache.size >= this.#maxSize) {
      this.#evict();
    }

    const controller = new AbortController();

    this.#cache.set(key, {
      value: value(controller.signal),
      controller,
    });
  }

  delete(key: K) {
    if (this.#cache.has(key)) {
      this.#dispose(key);
      return true;
    }
    return false;
  }

  clear() {
    for (const key of this.#cache.keys()) {
      this.#dispose(key);
    }
  }

  retain(key: K) {
    this.#refCounts.set(key, (this.#refCounts.get(key) ?? 0) + 1);
  }

  release(key: K) {
    const count = this.#refCounts.get(key) ?? 0;
    if (count > 0) {
      this.#refCounts.set(key, count - 1);
    }

    if ((this.#refCounts.get(key) ?? 0) === 0) {
      this.#refCounts.delete(key);
      if (this.#cache.size > this.#maxSize) {
        this.#evict();
      }
    }
  }
}

export type CachePolicy =
  | { type: 'keep-all' }
  | { type: 'most-recent' }
  | { type: 'lru'; maxSize: number };

const cacheFromPolicy = <K, V>(policy: CachePolicy): Cache<K, V> => {
  switch (policy.type) {
    case 'keep-all':
      return new LRUCache<K, V>(Number.POSITIVE_INFINITY);
    case 'most-recent':
      return new LRUCache<K, V>(1);
    case 'lru':
      return new LRUCache<K, V>(policy.maxSize);
    default:
      return policy satisfies never;
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type KeyMaker<A> = (arg: A) => any;

type MemoizeOptions<A> = {
  cachePolicy?: CachePolicy;
  keyMaker?: KeyMaker<A>;
};

type Tools = {
  retain: VoidFunction;
  release: VoidFunction;
};

export const memoize = <A, R>(
  fn: (arg: A, tools: Tools) => Evictable<R>,
  {
    cachePolicy = { type: 'keep-all' },
    keyMaker = identity,
  }: MemoizeOptions<A> = {},
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cache = cacheFromPolicy<any, R>(cachePolicy);

  return (arg: A) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const key = keyMaker(arg);

    if (!cache.has(key)) {
      cache.set(
        key,
        fn(arg, {
          retain: () => cache.retain(key),
          release: () => cache.release(key),
        }),
      );
    }

    return cache.get(key)!;
  };
};
