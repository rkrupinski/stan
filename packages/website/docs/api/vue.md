---
sidebar_position: 9
description: Vue API reference
---

# Vue

[Vue](https://vuejs.org) bindings for Stan (`@rkrupinski/stan/vue`).

## `useStan`

Returns a [`WritableComputedRef`](https://vuejs.org/api/reactivity-core.html#computed) for [`WritableState<T>`](./state.md#writablestatet). Reading `.value` subscribes to state changes; assigning to `.value` writes through to the store. Works with `v-model`.

Works with: [`atom`](./atom.md), [`atomFamily`](./atomFamily.md)

```ts
const useStan: <T>(
  scopedState: Scoped<WritableState<T>>,
) => WritableComputedRef<T>;
```

:::info
`useStan` does not work with [`ReadonlyState<T>`](./state.md#readonlystatet).
:::

Example:

```vue
<script setup lang="ts">
import { atom } from '@rkrupinski/stan';
import { useStan } from '@rkrupinski/stan/vue';

const myAtom = atom(42);

const count = useStan(myAtom);
</script>

<template>
  <pre>{{ count }}</pre>
  <button @click="count++">Add one</button>
</template>
```

## `useStanValue`

Returns a readonly [`Ref`](https://vuejs.org/api/reactivity-core.html#ref) for [`ReadonlyState<T>`](./state.md#readonlystatet). It will also subscribe to (and unsubscribe from) state changes.

Works with: [`selector`](./selector.md), [`selectorFamily`](./selectorFamily.md)

```ts
const useStanValue: <T>(
  scopedState: Scoped<ReadonlyState<T>>,
) => Readonly<Ref<T>>;
```

:::info
For [`WritableState<T>`](./state.md#writablestatet) (atoms), use [`useStan`](#usestan) instead.
:::

Example:

```vue
<script setup lang="ts">
import { atom, selector } from '@rkrupinski/stan';
import { useStanValue } from '@rkrupinski/stan/vue';

const myAtom = atom(42);

const doubled = selector(({ get }) => get(myAtom) * 2);

const value = useStanValue(doubled);
</script>

<template>
  <p>{{ value }}</p>
</template>
```

## `useStanValueAsync`

Wraps [`ReadonlyState<T>`](./state.md#readonlystatet) whose type extends `PromiseLike<any>` in a readonly `Ref` of a special union type:

```ts
type AsyncValue<T, E = unknown> =
  | { type: 'loading' }
  | { type: 'ready'; value: T }
  | { type: 'error'; reason: E };
```

Works with: [`selector`](./selector.md), [`selectorFamily`](./selectorFamily.md)

```ts
const useStanValueAsync: <T, E = unknown>(
  scopedState: Scoped<ReadonlyState<PromiseLike<T>>>,
) => Readonly<Ref<AsyncValue<T, E>>>;
```

:::info
`useStanValueAsync` is specifically designed to work only with asynchronous state (`State<PromiseLike<any>>`). Failing to comply may result in unpredictable behavior or errors.
:::

Example:

```vue
<script setup lang="ts">
import { selector } from '@rkrupinski/stan';
import { useStanValueAsync } from '@rkrupinski/stan/vue';

const luke = selector(async ({ signal }) => {
  const res = await fetch('https://www.swapi.tech/api/people/1', { signal });

  return res.json();
});

const result = useStanValueAsync(luke);
</script>

<template>
  <p v-if="result.type === 'loading'">Loading&hellip;</p>
  <p v-else-if="result.type === 'error'">{{ String(result.reason) }}</p>
  <pre v-else>{{ JSON.stringify(result.value, null, 2) }}</pre>
</template>
```

## `useStanRefresh`

Wraps [`refresh`](./utils.md#refresh) and returns a function that refreshes [`ReadonlyState<T>`](./state.md#readonlystatet).

Works with: [`selector`](./selector.md), [`selectorFamily`](./selectorFamily.md)

```ts
const useStanRefresh: <T>(scopedState: Scoped<ReadonlyState<T>>) => () => void;
```

Example:

```vue
<script setup lang="ts">
import { selectorFamily } from '@rkrupinski/stan';
import { useStanRefresh } from '@rkrupinski/stan/vue';

const props = defineProps<{ userId: string }>();

const users = selectorFamily<Promise<User>, string>(id => () => getUser(id));

const refresh = useStanRefresh(users(props.userId));
</script>

<template>
  <UserDetails :user-id="userId" />
  <button @click="refresh">Refresh</button>
</template>
```

## `useStanReset`

Wraps [`reset`](./utils.md#reset) and returns a function that resets [`WritableState<T>`](./state.md#writablestatet).

Works with: [`atom`](./atom.md), [`atomFamily`](./atomFamily.md)

```ts
const useStanReset: <T>(scopedState: Scoped<WritableState<T>>) => () => void;
```

Example:

```vue
<script setup lang="ts">
import { atom } from '@rkrupinski/stan';
import { useStan, useStanReset } from '@rkrupinski/stan/vue';

const counter = atom(0);

const count = useStan(counter);
const resetCount = useStanReset(counter);
</script>

<template>
  <pre>{{ count }}</pre>
  <button @click="count++">Increment</button>
  <button @click="resetCount">Reset</button>
</template>
```

## `useStanCallback`

Returns a callback with access to helper functions for interacting with Stan state (setting, refreshing, etc.).

```ts
const useStanCallback: <A extends unknown[], R>(
  factory: (helpers: StanCallbackHelpers) => (...args: A) => R,
) => (...args: A) => R;
```

- `factory` – A curried callback function, where:
  - `helpers` – State helpers:
    - `get` – A function for getting [`State<T>`](./state.md#statet) value, with the following signature:
      ```ts
      <T>(scopedState: Scoped<State<T>>) => T;
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

:::info
Unlike React's [`useStanCallback`](./react.md#usestancallback), the Vue composable takes no `deps` array. A Vue component's `setup()` runs once, so the returned callback already captures the latest values via closure.
:::

Example:

```vue
<script setup lang="ts">
import { selectorFamily } from '@rkrupinski/stan';
import { useStanCallback } from '@rkrupinski/stan/vue';

const user = selectorFamily<Promise<User>, string>(
  userId => () => loadUser(userId),
);

const reloadUser = useStanCallback(({ refresh }) => (userId: string) => {
  refresh(user(userId));
});
</script>

<template>
  <ul>
    <li v-for="{ id, name } in users" :key="id">
      {{ name }}
      <button @click="reloadUser(id)">Refresh</button>
    </li>
  </ul>
</template>
```

## `StanProvider`

Stan, by default, operates in provider-less mode, using [`DEFAULT_STORE`](./store.md#the-store-class). However, if you need to supply a different store (e.g., for [SSR](../guides/ssr.md)) or switch stores dynamically, `StanProvider` comes in handy.

Using `StanProvider` creates an isolation boundary:

- **No provider** — composables use `DEFAULT_STORE`
- **`StanProvider` without `store` prop** — creates a fresh, isolated store
- **`StanProvider` with `store` prop** — uses the provided store

:::info
To switch stores dynamically, use the `:key` attribute on `StanProvider` to re-mount the subtree. Composables like `useStan` and `useStanValue` bind to the store at setup time, so changing the `:store` prop alone won't re-subscribe them. [`useStanCallback`](#usestancallback) is the exception — it reads the store at invocation time and will automatically pick up a new store.
:::

```ts
const StanProvider: DefineComponent<StanProviderProps>;
```

Props:

- `store?` - A [`Store`](./store.md#the-store-class) instance.

Example:

```vue
<script setup lang="ts">
import { makeStore } from '@rkrupinski/stan';
import { StanProvider } from '@rkrupinski/stan/vue';

const myStore = makeStore();
</script>

<template>
  <StanProvider :store="myStore">
    <Layout>
      <RouterView />
    </Layout>
  </StanProvider>
</template>
```

## `provideStan`

An alternative to wrapping your tree in [`StanProvider`](#stanprovider): call `provideStan` in a component's `setup()` to provide a store to descendants.

```ts
const provideStan: (store?: Store) => void;
```

Example:

```vue
<script setup lang="ts">
import { makeStore } from '@rkrupinski/stan';
import { provideStan } from '@rkrupinski/stan/vue';

const myStore = makeStore();

provideStan(myStore);
</script>

<template>
  <Layout>
    <RouterView />
  </Layout>
</template>
```

## `useStanStore`

In rare cases where you need to peek into the current Stan store injection, here's how you can do it.

```ts
const useStanStore: () => StanStoreInjection;
```

`StanStoreInjection` fields:

- `store` - A [`ComputedRef`](https://vuejs.org/api/reactivity-core.html#computed) wrapping the current [`Store`](./store.md#the-store-class) instance.

:::info
`useStanStore` is a low-level API and should therefore be considered unstable.
:::

## See also

- [State](./state.md)
- [Store](./store.md)
- [Examples](../getting-started/examples.mdx)
