type StoreEvent =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { type: 'SET'; key: string; value: any } | { type: 'DELETE'; key: string };

type DevToolsHook = {
  register(store: Store): void;
  unregister(store: Store): void;
  send(storeKey: string, event: StoreEvent): void;
};

declare global {
  interface Window {
    __STAN_DEVTOOLS__?: DevToolsHook;
  }
}

let storeId = 0;

type Deps = Map<string, number>;

type Entry = {
  value: unknown;
  version: number;
  deps: Deps | null;
  mounted: boolean;
  initialized: boolean;
  hasValue: boolean;
};

const newEntry = (): Entry => ({
  value: undefined,
  version: 0,
  deps: null,
  mounted: false,
  initialized: false,
  hasValue: false,
});

export type StoreOptions = {
  tag?: string;
};

export class Store {
  /** @internal */
  readonly __v_skip = true;

  key: string;
  libVersion: string = process.env.STAN_VERSION;

  #entries = new Map<string, Entry>();

  constructor({ tag }: StoreOptions = {}) {
    this.key = `@@store${tag ? `[${tag}]` : ''}-${storeId++}`;

    if (process.env.NODE_ENV !== 'production') {
      window.__STAN_DEVTOOLS__?.register(this);
    }
  }

  #emit(event: StoreEvent): void {
    if (process.env.NODE_ENV !== 'production') {
      window.__STAN_DEVTOOLS__?.send(this.key, event);
    }
  }

  #touch(key: string): Entry {
    let e = this.#entries.get(key);
    if (!e) {
      e = newEntry();
      this.#entries.set(key, e);
    }
    return e;
  }

  destroy() {
    this.#entries.clear();

    if (process.env.NODE_ENV !== 'production') {
      window.__STAN_DEVTOOLS__?.unregister(this);
    }
  }

  erase(key: string) {
    this.#entries.delete(key);
    this.#emit({ type: 'DELETE', key });
  }

  /** @internal */
  has(key: string) {
    return this.#entries.get(key)?.hasValue ?? false;
  }

  /** @internal */
  peek<T>(key: string): T {
    return this.#entries.get(key)?.value as T;
  }

  /** @internal */
  seed(key: string, v: unknown) {
    const e = this.#touch(key);
    e.value = v;
    e.hasValue = true;
    this.#emit({ type: 'SET', key, value: v });
  }

  /** @internal */
  commit(key: string, v: unknown) {
    const e = this.#touch(key);
    e.version += 1;
    e.value = v;
    e.hasValue = true;
    this.#emit({ type: 'SET', key, value: v });
  }

  /** @internal */
  versionOf(key: string) {
    return this.#entries.get(key)?.version ?? 0;
  }

  /** @internal */
  isReady(key: string) {
    return this.#entries.get(key)?.initialized ?? false;
  }

  /** @internal */
  markReady(key: string) {
    this.#touch(key).initialized = true;
  }

  /** @internal */
  markStale(key: string) {
    this.#touch(key).initialized = false;
  }

  /** @internal */
  isMounted(key: string) {
    return this.#entries.get(key)?.mounted ?? false;
  }

  /** @internal */
  mount(key: string) {
    this.#touch(key).mounted = true;
  }

  /** @internal */
  unmount(key: string) {
    this.#touch(key).mounted = false;
  }

  /** @internal */
  resetDeps(key: string) {
    const e = this.#touch(key);
    if (e.deps) {
      e.deps.clear();
    } else {
      e.deps = new Map();
    }
  }

  /** @internal */
  trackDep(key: string, depKey: string) {
    const e = this.#touch(key);
    if (!e.deps) e.deps = new Map();
    if (e.deps.has(depKey)) return false;
    e.deps.set(depKey, this.#entries.get(depKey)?.version ?? 0);
    return true;
  }

  /** @internal */
  depsChanged(key: string): boolean {
    const d = this.#entries.get(key)?.deps;
    if (!d || !d.size) return false;
    for (const [k, v] of d) {
      if ((this.#entries.get(k)?.version ?? 0) !== v) return true;
    }
    for (const k of d.keys()) {
      if (this.depsChanged(k)) return true;
    }
    return false;
  }

  /** @internal */
  *entries(): IterableIterator<[string, unknown]> {
    for (const [k, e] of this.#entries) {
      if (e.hasValue) yield [k, e.value];
    }
  }
}

export const makeStore = (options?: StoreOptions) => new Store(options);

export const DEFAULT_STORE = makeStore({ tag: 'Default' });
