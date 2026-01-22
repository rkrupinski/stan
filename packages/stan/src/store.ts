type StoreEvent =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { type: 'SET'; key: string; value: any } | { type: 'DELETE'; key: string };

interface DevToolsHook {
  register(store: Store): void;
  unregister(store: Store): void;
  send(storeId: string, event: StoreEvent): void;
}

declare global {
  interface Window {
    __STAN_DEVTOOLS__?: DevToolsHook;
  }
}

const connectToDevTools = (store: Store) => {
  window.__STAN_DEVTOOLS__?.register(store);

  return (e: StoreEvent) => {
    window.__STAN_DEVTOOLS__?.send(store.key, e);
  };
};

const disconnectFromDevTools = (store: Store) => {
  window.__STAN_DEVTOOLS__?.unregister(store);
};

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

  deps = new Map<string, Deps>();
  value =
    process.env.NODE_ENV !== 'production'
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        new ObservableMap<string, any>(connectToDevTools(this))
      : // eslint-disable-next-line @typescript-eslint/no-explicit-any
        new Map<string, any>();
  version = new Map<string, number>();
  mounted = new Map<string, boolean>();
  initialized = new Map<string, boolean>();

  constructor({ tag }: StoreOptions = {}) {
    this.key = `@@store${tag ? `[${tag}]` : ''}-${++storeId}`;
  }

  destroy() {
    this.deps.clear();
    this.value.clear();
    this.version.clear();
    this.mounted.clear();
    this.initialized.clear();

    if (process.env.NODE_ENV !== 'production') {
      disconnectFromDevTools(this);
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
