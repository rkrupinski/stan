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
  #locks: Map<K, number>;
  #maxSize: number;

  constructor(maxSize: number) {
    this.#cache = new Map();
    this.#locks = new Map();
    this.#maxSize = maxSize;
  }

  #evictLeastRecentlyUsed(): void {
    for (const key of this.#cache.keys()) {
      if ((this.#locks.get(key) ?? 0) > 0) {
        continue;
      }

      this.#cache.get(key)?.controller.abort();
      this.#cache.delete(key);
      return;
    }
  }

  has(key: K) {
    return this.#cache.has(key);
  }

  get(key: K) {
    const entry = this.#cache.get(key);

    if (!entry) return undefined;

    this.#cache.delete(key);
    this.#cache.set(key, entry);

    return entry.value;
  }

  set(key: K, value: Evictable<V>) {
    if (this.#cache.has(key)) {
      this.#cache.delete(key);
    } else if (this.#cache.size >= this.#maxSize) {
      this.#evictLeastRecentlyUsed();
    }

    const controller = new AbortController();

    this.#cache.set(key, {
      value: value(controller.signal),
      controller,
    });
  }

  delete(key: K) {
    this.#locks.delete(key);
    return this.#cache.delete(key);
  }

  clear() {
    this.#locks.clear();
    this.#cache.clear();
  }

  retain(key: K) {
    this.#locks.set(key, (this.#locks.get(key) ?? 0) + 1);
  }

  release(key: K) {
    const count = this.#locks.get(key) ?? 0;
    if (count > 0) {
      this.#locks.set(key, count - 1);
    }

    if ((this.#locks.get(key) ?? 0) === 0) {
      this.#locks.delete(key);
      if (this.#cache.size > this.#maxSize) {
        this.#evictLeastRecentlyUsed();
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
