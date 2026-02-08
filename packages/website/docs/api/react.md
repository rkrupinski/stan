---
sidebar_position: 8
description: React API reference
---

# React

[React](https://react.dev) bindings for Stan (`@rkrupinski/stan/react`).

## `useStanValue`

Returns the value of any Stan state ([`WritableState<T>`](./state.md#writablestatet) or [`ReadonlyState<T>`](./state.md#readonlystatet)). It will also subscribe to (and unsubscribe from) state changes.

Works with: [`atom`](./atom.md), [`atomFamily`](./atomFamily.md), [`selector`](./selector.md),
[`selectorFamily`](./selectorFamily.md)

```ts
const useStanValue: <T>(scopedState: Scoped<State<T>>) => T;
```

Example:

```tsx
const myAtom = atom(42);

function MyComponent() {
  const value = useStanValue(myAtom);

  return <p>{value}</p>;
}
```

## `useSetStanValue`

Returns a setter or updater function for [`WritableState<T>`](./state.md#writablestatet).

Works with: [`atom`](./atom.md), [`atomFamily`](./atomFamily.md)

```ts
const useSetStanValue: <T>(
  scopedState: Scoped<WritableState<T>>,
) => SetterOrUpdater<T>;
```

:::info
`useSetStanValue` does not work with [`ReadonlyState<T>`](./state.md#readonlystatet).
:::

Example:

```tsx
const myAtom = atom(42);

function MyComponent() {
  const setValue = useSetStanValue(myAtom);

  return (
    <button
      onClick={() => {
        setValue(prev => prev + 1);
      }}
    >
      Add one
    </button>
  );
}
```

## `useStan`

Returns a tuple with a value and a setter or updater function for [`WritableState<T>`](./state.md#writablestatet). Think of it as a combination of [`useStanValue`](#usestanvalue) and [`useSetStanValue`](#usesetstanvalue) - a Stan-specific version of React's `useState`.

Works with: [`atom`](./atom.md), [`atomFamily`](./atomFamily.md)

```ts
const useStan: <T>(
  scopedState: Scoped<WritableState<T>>,
) => readonly [T, SetterOrUpdater<T>];
```

:::info
`useStan` does not work with [`ReadonlyState<T>`](./state.md#readonlystatet).
:::

Example:

```tsx
const myAtom = atom(42);

function MyComponent() {
  const [value, setValue] = useStan(myAtom);

  return (
    <>
      <pre>{value}</pre>
      <button
        onClick={() => {
          setValue(prev => prev + 1);
        }}
      >
        Add one
      </button>
    </>
  );
}
```

## `useStanValueAsync`

Wraps any Stan state ([`WritableState<T>`](./state.md#writablestatet) or [`ReadonlyState<T>`](./state.md#readonlystatet)) whose type extends `PromiseLike<any>` in a special union type:

```ts
type AsyncValue<T, E = unknown> =
  | { type: 'loading' }
  | { type: 'ready'; value: T }
  | { type: 'error'; reason: E };
```

Works with: [`atom`](./atom.md), [`atomFamily`](./atomFamily.md), [`selector`](./selector.md),
[`selectorFamily`](./selectorFamily.md)

```ts
const useStanValueAsync: <T, E = unknown>(
  scopedState: Scoped<State<PromiseLike<T>>>,
) => AsyncValue<T, E>;
```

:::info
`useStanValueAsync` is specifically designed to work only with asynchronous state (`State<PromiseLike<any>>`). Failing to comply may result in unpredictable behavior or errors.
:::

Example:

```tsx
const luke = selector(async ({ signal }) => {
  const res = await fetch('https://www.swapi.tech/api/people/1', { signal });

  return res.json();
});

function MyComponent() {
  const result = useStanValueAsync(luke);

  switch (result.type) {
    case 'loading':
      return <p>Loading&hellip;</p>;

    case 'error':
      return <p>{String(result.reason)}</p>;

    case 'ready':
      return <pre>{JSON.stringify(result.value, null, 2)}</pre>;
  }
}
```

## `useStanRefresh`

Wraps [`refresh`](./utils.md#refresh) and returns a function that refreshes [`ReadonlyState<T>`](./state.md#readonlystatet).

Works with: [`selector`](./selector.md), [`selectorFamily`](./selectorFamily.md)

```ts
const useStanRefresh: <T>(scopedState: Scoped<ReadonlyState<T>>) => () => void;
```

Example:

```tsx
const users = selectorFamily<Promise<User>, string>(id => () => getUser(id));

function MyComponent({ userId }: { userId: string }) {
  const refresh = useStanRefresh(users(userId));

  return (
    <>
      <UserDetails userId={userId} />
      <button onClick={refresh}>Refresh</button>
    </>
  );
}
```

## `useStanReset`

Wraps [`reset`](./utils.md#reset) and returns a function that resets [`WritableState<T>`](./state.md#writablestatet).

Works with: [`atom`](./atom.md), [`atomFamily`](./atomFamily.md)

```ts
const useStanReset: <T>(scopedState: Scoped<WritableState<T>>) => () => void;
```

Example:

```tsx
const counter = atom(0);

function MyComponent() {
  const [value, setValue] = useStan(counter);
  const resetValue = useStanReset(counter);

  return (
    <>
      <pre>{value}</pre>
      <button
        onClick={() => {
          setValue(prev => prev + 1);
        }}
      >
        Increment
      </button>
      <button onClick={resetValue}>Reset</button>
    </>
  );
}
```

## `useStanCallback`

Returns a memoized callback with access to helper functions for interacting with Stan state (setting, refreshing, etc.).

```ts
const useStanCallback: <A extends unknown[], R>(
  factory: (helpers: StanCallbackHelpers) => (...args: A) => R,
  deps?: DependencyList,
) => (...args: A) => R;
```

- `factory` – A curried callback function, where:
  - `helpers` – State helpers:
    - `get` – A function for getting [`State<T>`](./state.md#statet) value, with the following signature:
      ```ts
      <T>(scopedState: Scoped<State<T>>) => T
      ```
    - `set` – A function for setting [`WritableState<T>`](./state.md#writablestatet), with the following signature:
      ```ts
      <T>(
        scopedState: Scoped<WritableState<T>>,
        valueOrUpdater: T | ((currentValue: T) => T),
      ) => void
      ```
    - `reset` – A function for [resetting](./utils.md#reset) [`WritableState<T>`](./state.md#writablestatet), with the following signature:
      ```ts
      <T>(scopedState: Scoped<WritableState<T>>) => void
      ```
    - `refresh` – A function for [refreshing](./utils.md#refresh) [`ReadonlyState<T>`](./state.md#readonlystatet), with the following signature:
      ```ts
      <T>(scopedState: Scoped<ReadonlyState<T>>) => void
      ```
- `deps?` – An array of dependencies (see [`useCallback`](https://react.dev/reference/react/useCallback)).

Example:

```tsx
const user = selectorFamily<Promise<User>, string>(
  userId => () => loadUser(userId),
);

function MyComponent() {
  const reloadUser = useStanCallback(({ refresh }) => (userId: string) => {
    refresh(user(userId));
  });

  return (
    <ul>
      {users.map(({ id, name }) => (
        <li key={id}>
          {name}{' '}
          <button
            onClick={() => {
              reloadUser(id);
            }}
          >
            Refresh
          </button>
        </li>
      ))}
    </ul>
  );
}
```

## `StanProvider`

Stan, by default, operates in provider-less mode, using [`DEFAULT_STORE`](./store.md#the-store-class). However, if you need to supply a different store (e.g., for [SSR](../guides/ssr.md)) or switch stores dynamically, `StanProvider` comes in handy. Re-mounting `StanProvider` can also serve as a way to reset all state.

```ts
const StanProvider: FC<StanProviderProps>;
```

Props:

- `store?` - A [`Store`](./store.md#the-store-class) instance.

Example:

```tsx
const myStore = makeStore();

function MyApp() {
  return (
    <StanProvider store={myStore}>
      <Layout>
        <Routes />
      </Layout>
    </StanProvider>
  );
}
```

## `useStanCtx`

In rare cases where you need to peek into the current Stan context, here's how you can do it.

```ts
const useStanCtx: () => StanCtxType;
```

`StanCtxType` fields:

- `store` - The current [`Store`](./store.md#the-store-class) instance.

:::info
`useStanCtx` is a low-level API and should therefore be considered unstable.
:::

## See also

- [State](./state.md)
- [Store](./store.md)
- [Examples](../getting-started/examples.md)
