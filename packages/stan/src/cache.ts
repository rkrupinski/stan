export interface Cache<T> {
  has(key: string): boolean;
  get(key: string): T | undefined;
  set(key: string, value: T): void;
  delete(key: string): boolean;
  clear(): void;
}

export class LRUCache<T> implements Cache<T> {
  #cache: Map<string, T>;
  #maxSize: number;

  constructor(maxSize: number) {
    this.#cache = new Map();
    this.#maxSize = maxSize;
  }

  #evictLeastRecentlyUsed(): void {
    const firstKey = this.#cache.keys().next().value;

    if (typeof firstKey !== 'undefined') this.#cache.delete(firstKey);
  }

  has(key: string) {
    return this.#cache.has(key);
  }

  get(key: string): T | undefined {
    if (!this.has(key)) return undefined;

    const value = this.#cache.get(key);

    this.#cache.delete(key);
    this.#cache.set(key, value as T);

    return value;
  }

  set(key: string, value: T) {
    if (this.#cache.has(key)) {
      this.#cache.delete(key);
    } else if (this.#cache.size >= this.#maxSize) {
      this.#evictLeastRecentlyUsed();
    }

    this.#cache.set(key, value);
  }

  delete(key: string) {
    return this.#cache.delete(key);
  }

  clear() {
    this.#cache.clear();
  }
}

export class SimpleCache<T> extends Map<string, T> implements Cache<T> {}

export type CachePolicy =
  | { type: 'keep-all' }
  | { type: 'most-recent' }
  | { type: 'lru'; maxSize: number };

export const makeCache = <T>(policy: CachePolicy): Cache<T> => {
  switch (policy.type) {
    case 'keep-all':
      return new SimpleCache<T>();
    case 'most-recent':
      return new LRUCache<T>(1);
    case 'lru':
      return new LRUCache<T>(policy.maxSize);
    default:
      return policy satisfies never;
  }
};
