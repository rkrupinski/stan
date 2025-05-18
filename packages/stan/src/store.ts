type Deps = Map<string, number>;

export class Store {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value = new Map<string, any>();
  version = new Map<string, number>();
  mounted = new Map<string, boolean>();
  initialized = new Map<string, boolean>();
  deps = new Map<string, Deps>();
}

export const makeStore = () => new Store();

export const DEFAULT_STORE = makeStore();

export type Scoped<T> = (store: Store) => T;
