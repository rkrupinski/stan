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

class ObservableMap<K extends string, V> extends Map<K, V> {
  #onUpdate: (e: StoreEvent) => void;

  constructor(onUpdate: (e: StoreEvent) => void) {
    super();
    this.#onUpdate = onUpdate;
  }

  set(key: K, value: V) {
    super.set(key, value);
    this.#onUpdate({ type: 'SET', key, value });
    return this;
  }

  delete(key: K) {
    const result = super.delete(key);
    this.#onUpdate({ type: 'DELETE', key });
    return result;
  }
}

let storeId = 0;

type Deps = Map<string, number>;

export type StoreOptions = {
  tag?: string;
};

export class Store {
  key: string;
  libVersion: string = process.env.STAN_VERSION;

  deps = new Map<string, Deps>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value = new Map<string, any>();
  version = new Map<string, number>();
  mounted = new Map<string, boolean>();
  initialized = new Map<string, boolean>();

  constructor({ tag }: StoreOptions = {}) {
    this.key = `@@store${tag ? `[${tag}]` : ''}-${storeId++}`;

    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.value = new ObservableMap<string, any>(e => {
        window.__STAN_DEVTOOLS__?.send(this.key, e);
      });
      window.__STAN_DEVTOOLS__?.register(this);
    }
  }

  destroy() {
    this.deps.clear();
    this.value.clear();
    this.version.clear();
    this.mounted.clear();
    this.initialized.clear();

    if (process.env.NODE_ENV !== 'production') {
      window.__STAN_DEVTOOLS__?.unregister(this);
    }
  }

  erase(key: string) {
    this.deps.delete(key);
    this.value.delete(key);
    this.version.delete(key);
    this.mounted.delete(key);
    this.initialized.delete(key);
  }
}

export const makeStore = (options?: StoreOptions) => new Store(options);

export const DEFAULT_STORE = makeStore({ tag: 'Default' });
