import { identity } from './misc';

interface Cache<K, V> {
  has(key: K): boolean;
  get(key: K): V | undefined;
  set(key: K, value: V): void;
  delete(key: K): boolean;
  clear(): void;
}

class LRUCache<K, V> implements Cache<K, V> {
  #cache: Map<K, V>;
  #maxSize: number;

  constructor(maxSize: number) {
    this.#cache = new Map();
    this.#maxSize = maxSize;
  }

  #evictLeastRecentlyUsed(): void {
    const firstKey = this.#cache.keys().next().value;

    if (typeof firstKey !== 'undefined') this.#cache.delete(firstKey);
  }

  has(key: K) {
    return this.#cache.has(key);
  }

  get(key: K): V | undefined {
    if (!this.has(key)) return undefined;

    const value = this.#cache.get(key);

    this.#cache.delete(key);
    this.#cache.set(key, value as V);

    return value;
  }

  set(key: K, value: V) {
    if (this.#cache.has(key)) {
      this.#cache.delete(key);
    } else if (this.#cache.size >= this.#maxSize) {
      this.#evictLeastRecentlyUsed();
    }

    this.#cache.set(key, value);
  }

  delete(key: K) {
    return this.#cache.delete(key);
  }

  clear() {
    this.#cache.clear();
  }
}

class SimpleCache<K, V> extends Map<K, V> implements Cache<K, V> {}

export type CachePolicy =
  | { type: 'keep-all' }
  | { type: 'most-recent' }
  | { type: 'lru'; maxSize: number };

const makeCache = <K, V>(policy: CachePolicy): Cache<K, V> => {
  switch (policy.type) {
    case 'keep-all':
      return new SimpleCache<K, V>();
    case 'most-recent':
      return new LRUCache<K, V>(1);
    case 'lru':
      return new LRUCache<K, V>(policy.maxSize);
    default:
      return policy satisfies never;
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type KeyMaker<A> = (arg: A) => any;

export type MemoizeOptions<A> = {
  cachePolicy?: CachePolicy;
  keyMaker?: KeyMaker<A>;
};

export const memoize = <A, R>(
  fn: (arg: A) => R,
  {
    cachePolicy = { type: 'keep-all' },
    keyMaker = identity,
  }: MemoizeOptions<A> = {},
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cache = makeCache<any, R>(cachePolicy);

  return (arg: A) => {
    const key = keyMaker(arg);

    if (!cache.has(key)) {
      cache.set(key, fn(arg));
    }

    return cache.get(key) as R;
  };
};
