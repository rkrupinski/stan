---
name: stan
description: Guidance for working with @rkrupinski/stan, a minimal, type-safe, framework-agnostic state management library for JavaScript. Ships with first-class React bindings today, with more framework integrations planned. Use when the user is using, learning, or integrating Stan atoms, selectors, the vanilla store, or any framework bindings.
license: MIT
metadata:
  homepage: https://stan.party
  repository: https://github.com/rkrupinski/stan
---

# Working with `@rkrupinski/stan`

Stan is a minimal, type-safe, framework-agnostic state management library. The core has no framework dependency; React bindings ship alongside today, with more integrations planned.

## Mental model

- **Two entry points — use the right one:**
  - `@rkrupinski/stan` — core primitives (atoms, selectors, store, utils). Framework-agnostic.
  - `@rkrupinski/stan/react` — React hooks and `StanProvider`. Peer dep: React ≥19. **Never import hooks from the core entry point.**
- Atoms and selectors are **scoped factory functions**, not values:
  ```ts
  type Scoped<T> = (store: Store) => T;
  ```
  `myAtom(store)` returns the per-store `State` handle (memoized — same call, same instance).
- A `Store` holds values; primitives only define shape. When there's no `StanProvider`, React hooks fall back to `DEFAULT_STORE`.
- `atom` → `WritableState<T>` (has `.set`). `selector` → `ReadonlyState<T>` (read-only, supports `refresh`).

## Core API

### `atom`

```ts
import { atom } from '@rkrupinski/stan';

const countAtom = atom(0, { tag: 'count' });
```

Options: `tag`, `effects`, `areValuesEqual` (default: strict equality).

### `atomFamily`

```ts
import { atomFamily } from '@rkrupinski/stan';

const todoAtom = atomFamily<Todo, string>(
  id => ({ id, done: false, text: '' }),
  { tag: id => `todo:${id}` },
);

todoAtom('abc'); // Scoped<WritableState<Todo>>
```

`P` must be JSON-serializable. Keys are normalized via `fast-json-stable-stringify` (object property order doesn't matter).

### `selector`

```ts
import { selector } from '@rkrupinski/stan';

const doubleAtom = selector(({ get }) => get(countAtom) * 2);

const userQuery = selector(async ({ get, signal }) => {
  const res = await fetch(`/api/users/${get(userIdAtom)}`, { signal });
  return res.json();
});
```

The selector fn receives `{ get, signal }`. `get(dep)` subscribes you to `dep`. `signal` is an `AbortSignal` that fires when deps change or the selector is torn down.

### `selectorFamily`

```ts
import { selectorFamily } from '@rkrupinski/stan';

const searchResults = selectorFamily<SearchResult[], string>(
  phrase =>
    async ({ signal }) => {
      const res = await fetch(`/api/search?q=${phrase}`, { signal });
      return res.json();
    },
  { cachePolicy: { type: 'lru', maxSize: 10 } },
);
```

`cachePolicy`: `{ type: 'keep-all' }` (default) | `{ type: 'most-recent' }` | `{ type: 'lru', maxSize }`.

### `refresh` / `reset`

```ts
import { refresh, reset } from '@rkrupinski/stan';

refresh(mySelector(store)); // force re-eval (lazy if unmounted)
reset(myAtom(store)); //       back to initial value, notifies subscribers
```

## React bindings

```ts
import {
  StanProvider,
  useStan,
  useStanValue,
  useSetStanValue,
  useStanValueAsync,
  useStanRefresh,
  useStanReset,
  useStanCallback,
} from '@rkrupinski/stan/react';
```

### Reading / writing

```tsx
const [count, setCount] = useStan(countAtom); // read + write
const double = useStanValue(doubleAtom); //      read only (subscribes)
const setCount = useSetStanValue(countAtom); //  write only (does NOT subscribe — render optimization)
```

### Async selectors

```tsx
const result = useStanValueAsync(userQuery);
if (result.type === 'loading') return <Spinner />;
if (result.type === 'error') return <Error reason={result.reason} />;
return <div>{result.value.name}</div>;
```

`AsyncValue<T, E>` is `{ type: 'loading' } | { type: 'ready'; value: T } | { type: 'error'; reason: E }`. The underlying selector must return a `PromiseLike<T>`.

### Imperative refresh / reset

```tsx
const refreshUser = useStanRefresh(userQuery);
const resetCount = useStanReset(countAtom);
```

### `useStanCallback`

Event-handler helper. Gives you `get` / `set` / `reset` / `refresh` without subscribing the component to the state you touch.

```tsx
const handleRetry = useStanCallback(({ refresh }) => (id: string) => {
  refresh(todoDetails(id));
});
```

The second argument is a React deps list (default `[]`). The returned callback reference is stable across renders for the same `[store, ...deps]`.

### `StanProvider`

```tsx
<StanProvider store={myStore}>
  <App />
</StanProvider>
```

If no `store` prop is passed, the provider creates a fresh store. Use it for SSR (per-request isolation) and multi-store apps. Without any provider, hooks use `DEFAULT_STORE`.

## Vanilla usage

The core API works standalone — everything the hooks do is available directly:

```ts
import { atom, makeStore } from '@rkrupinski/stan';

const store = makeStore();
const countAtom = atom(0);

const state = countAtom(store);
state.get(); // 0
state.set(1);
state.set(prev => prev + 1);
const unsubscribe = state.subscribe(v => console.log(v));
```

## Patterns

### Async with cancellation

Pass `signal` to `fetch`. Stan aborts the previous in-flight request whenever deps change.

```ts
const userQuery = selector(async ({ get, signal }) => {
  const res = await fetch(`/api/user/${get(userIdAtom)}`, { signal });
  return res.json();
});
```

### Chained async selectors

`await get(upstream)` composes. Rejected upstream promises propagate through `await`.

```ts
const profile = selector(async ({ get }) => {
  const user = await get(userQuery);
  return get(profileFor(user.id));
});
```

### Persistence via atom effects

```ts
const countAtom = atom(0, {
  effects: [
    ({ init, onSet }) => {
      const saved = localStorage.getItem('count');
      if (saved) init(Number(saved));
      onSet(v => localStorage.setItem('count', String(v)));
    },
  ],
});
```

`init` only works during the first-read initialization phase. `onSet` fires on subsequent public `set` calls.

### Dynamic dependencies

`get()` runs at evaluation time, so control flow decides what the selector actually subscribes to. Only the taken branch is tracked.

```ts
const visibleList = selector(({ get }) => {
  if (get(showArchived)) return get(archivedList);
  return get(activeList);
});
```

### Bounded parameterized caches

```ts
const results = selectorFamily<Result[], string>(
  query =>
    async ({ signal }) => {
      const res = await fetch(`/api/search?q=${query}`, { signal });
      return res.json();
    },
  { cachePolicy: { type: 'lru', maxSize: 5 } },
);
```

### Refresh one member of a family

```ts
const refreshTodo = useStanCallback(({ refresh }) => (id: string) => {
  refresh(todoDetails(id));
});
```

### Multi-store / store switching

```tsx
const stores = [makeStore(), makeStore()];

<StanProvider store={stores[active]}>
  <App />
</StanProvider>;
```

Each store is a fully independent state graph — atoms in one don't affect atoms in another.

### React Suspense

```tsx
import { use, Suspense } from 'react';

function UserName() {
  const user = use(useStanValue(userQuery));
  return <span>{user.name}</span>;
}

<Suspense fallback={<Spinner />}>
  <UserName />
</Suspense>;
```

`userQuery` is a selector returning a promise. `use()` throws the promise into Suspense.

## Gotchas

- **Import hooks from `@rkrupinski/stan/react`**, never from `@rkrupinski/stan`.
- **Selectors are lazy when unmounted.** No subscribers → no re-evaluation until next `.get()`. Don't expect a selector to update in the background if nothing is reading it.
- **Async selectors auto-abort on dep change.** Always pass `signal` through to `fetch` (or other cancellable APIs) — otherwise in-flight work leaks and results can race.
- **Family params must be JSON-serializable.** Keys are normalized via `fast-json-stable-stringify` (property order doesn't matter), but functions, symbols, class instances, and `Date`s will either break or stringify unstably.
- **`atomFamily` retains every member for the life of the store.** It has no eviction policy and no `cachePolicy` option. Each unique param creates a permanent atom (and runs its effects). Don't feed unbounded user input into an atom family.
- **`selectorFamily`'s `cachePolicy` controls which family _members_ are retained, not whether their _values_ are memoized.** A selector always re-evaluates when its dependencies change — `cachePolicy` (`keep-all` | `most-recent` | `lru`) only decides how many parameterized selector instances the family remembers. It is not a "cache the result for N seconds" knob.
- **Equality defaults to strict equality.** Setting an object or array produces a new reference and will always notify subscribers, even if the contents are identical. Pass `areValuesEqual` when structural equality matters.
- **Atom effects run lazily** on first access, not at `atom(...)` definition time. `init()` is only valid during that first-read phase; calling it later is a no-op.
- **Errors in selectors:** synchronous errors throw out of `.get()`; async errors surface through `useStanValueAsync` as `{ type: 'error', reason }`. Wrap your own try/catch inside the selector if you want a fallback value instead.
- **Calling `atom(store)` or `selector(store)` is cheap and idempotent** — results are memoized per store. Safe to call in React render.
- **For SSR, always wrap the tree in `<StanProvider>`** so each request gets an isolated store. Without a provider, every request shares `DEFAULT_STORE`.

## Debugging

Stan ships with a [Chrome DevTools extension](https://chromewebstore.google.com/detail/stan-devtools/jioipgcofbmgbdfmdjjcmockkjkhagac) for inspecting stores, tracking state history, and filtering entries.

Tag your state for readable labels:

```ts
atom('all', { tag: 'view' });
selector(filterTodos, { tag: 'filtered-todos' });

// Families: function tag maps param → label
selectorFamily<Result[], string>(query => () => search(query), {
  tag: query => `search:${query}`,
});
```

## Further reading

- Full distilled API reference: https://stan.party/llms-ctx-full.txt
- Documentation: https://stan.party
- Examples: https://github.com/rkrupinski/stan/tree/master/packages/examples
- Repository: https://github.com/rkrupinski/stan
