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

export type StoreOptions = {
  tag?: string;
};

export class Store {
  /** @internal */
  readonly __v_skip = true;

  key: string;
  libVersion: string = process.env.STAN_VERSION;

  #deps = new Map<string, Deps>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  #values = new Map<string, any>();
  #versions = new Map<string, number>();
  #mounted = new Map<string, boolean>();
  #initialized = new Map<string, boolean>();

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

  destroy() {
    this.#deps.clear();
    this.#values.clear();
    this.#versions.clear();
    this.#mounted.clear();
    this.#initialized.clear();

    if (process.env.NODE_ENV !== 'production') {
      window.__STAN_DEVTOOLS__?.unregister(this);
    }
  }

  erase(key: string) {
    this.#deps.delete(key);
    this.#values.delete(key);
    this.#versions.delete(key);
    this.#mounted.delete(key);
    this.#initialized.delete(key);
    this.#emit({ type: 'DELETE', key });
  }

  /** @internal */
  has(key: string) {
    return this.#values.has(key);
  }

  /** @internal */
  peek<T>(key: string): T {
    return this.#values.get(key) as T;
  }

  /** @internal */
  seed(key: string, v: unknown) {
    this.#values.set(key, v);
    this.#emit({ type: 'SET', key, value: v });
  }

  /** @internal */
  commit(key: string, v: unknown) {
    this.#versions.set(key, (this.#versions.get(key) ?? 0) + 1);
    this.#values.set(key, v);
    this.#emit({ type: 'SET', key, value: v });
  }

  /** @internal */
  versionOf(key: string) {
    return this.#versions.get(key) ?? 0;
  }

  /** @internal */
  isReady(key: string) {
    return !!this.#initialized.get(key);
  }

  /** @internal */
  markReady(key: string) {
    this.#initialized.set(key, true);
  }

  /** @internal */
  markStale(key: string) {
    this.#initialized.set(key, false);
  }

  /** @internal */
  isMounted(key: string) {
    return !!this.#mounted.get(key);
  }

  /** @internal */
  mount(key: string) {
    this.#mounted.set(key, true);
  }

  /** @internal */
  unmount(key: string) {
    this.#mounted.set(key, false);
  }

  /** @internal */
  resetDeps(key: string) {
    const d = this.#deps.get(key);
    if (d) {
      d.clear();
    } else {
      this.#deps.set(key, new Map());
    }
  }

  /** @internal */
  trackDep(key: string, depKey: string) {
    let d = this.#deps.get(key);
    if (!d) {
      d = new Map();
      this.#deps.set(key, d);
    }
    if (d.has(depKey)) return false;
    d.set(depKey, this.#versions.get(depKey) ?? 0);
    return true;
  }

  /** @internal */
  depsChanged(key: string) {
    const d = this.#deps.get(key);
    if (!d || !d.size) return false;
    for (const [k, v] of d.entries()) {
      if ((this.#versions.get(k) ?? 0) !== v) return true;
    }
    for (const k of d.keys()) {
      if (this.depsChanged(k)) return true;
    }
    return false;
  }

  /** @internal */
  entries(): IterableIterator<[string, unknown]> {
    return this.#values.entries();
  }
}

export const makeStore = (options?: StoreOptions) => new Store(options);

export const DEFAULT_STORE = makeStore({ tag: 'Default' });
