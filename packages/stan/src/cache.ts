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
}

class LRUCache<K, V> implements Cache<K, V> {
  #cache: Map<K, CacheEntry<V>>;
  #maxSize: number;

  constructor(maxSize: number) {
    this.#cache = new Map();
    this.#maxSize = maxSize;
  }

  #evictLeastRecentlyUsed(): void {
    const firstKey = this.#cache.keys().next().value;

    if (!firstKey) return;

    this.#cache.get(firstKey)?.controller.abort();
    this.#cache.delete(firstKey);
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
    return this.#cache.delete(key);
  }

  clear() {
    this.#cache.clear();
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

export const memoize = <A, R>(
  fn: (arg: A) => Evictable<R>,
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
      cache.set(key, fn(arg));
    }

    return cache.get(key)!;
  };
};
