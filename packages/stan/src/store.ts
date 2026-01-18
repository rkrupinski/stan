type Deps = Map<string, number>;

let storeId = 0;

export type StoreOptions = {
  tag?: string;
};

type StoreEvent =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { type: 'SET'; key: string; value: any }
  | { type: 'DELETE'; key: string };


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

const notifyDevTools = (e: StoreEvent) => {
  // DevTools bridge
  void e;
};

export class Store {
  key: string;
  version = new Map<string, number>();
  mounted = new Map<string, boolean>();
  initialized = new Map<string, boolean>();
  deps = new Map<string, Deps>();
  value =
    process.env.NODE_ENV !== 'production'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? new ObservableMap<string, any>(notifyDevTools) : new Map<string, any>();


  constructor(options: StoreOptions = {}) {
    const { tag } = options;
    this.key = `@@store${tag ? `[${tag}]` : ''}-${++storeId}`;
  }
}

export const makeStore = (options?: StoreOptions) => new Store(options);

export const DEFAULT_STORE = makeStore({ tag: 'Default' });
