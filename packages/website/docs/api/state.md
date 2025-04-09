---
sidebar_position: 1
description: The bread and butter of Stan
---

# State

At the core of Stan is state. All Stan APIs either create, update, or consume state. To keep things interesting, there are actually different types of state. Stan represents them as follows:

```ts
interface State<T> {
  tag?: string;
  get(): T;
  subscribe(callback: (value: T) => void): () => void;
}

interface ReadonlyState<T> extends State<T> {
  [REFRESH_TAG](): void;
}

interface WritableState<T> extends State<T> {
  set: SetterOrUpdater<T>;
}
```

Stan does not care about the type of value being stored, nor does it behave differently depending on the value type (with one small exception - see the [error handling guide](../guides/error-handling.md)).

## `State<T>`

Nothing in Stan directly produces objects of type `State<T>`, but all other state types inherit from it.

It comes with the following properties:

- `tag?` - An optional string identifier. It doesn't affect the state lifecycle but can be useful for debugging.
- `get` - A function that returns the current state value. When called on an uninitialized `ReadonlyState<T>`, it also initializes it.
- `subscribe` - Allows listening for state changes. It takes a callback function that's called with the new value and returns an unsubscribe function.

## `WritableState<T>`

Produced by:

- [`atom`](./atom.md)
- [`atomFamily`](./atomFamily.md)

This is a state that can both be set and read from. It is eagerly evaluated.

It inherits all properties from [`State<T>`](#statet), and additionally defines:

- `set` - A function for setting the state value.

## `ReadonlyState<T>`

Produced by:

- [`selector`](./selector.md)
- [`selectorFamily`](./selectorFamily.md)

As the name implies, this is a state that can only be read from. However, that doesn't mean it cannot change — it absolutely can:

- When it's refreshed (see [utils](./utils.md))
- When its dependencies change (see [`selector`](./selector.md))
- When its input changes (see [`selectorFamily`](./selectorFamily.md))

It is lazily evaluated.

:::info
`ReadonlyState<T>` is considered **mounted** when it has one or more subscribers. It is considered **unmounted** when it has no active subscribers.

`ReadonlyState<T>` is considered **initialized** if its value has been read. It is considered uninitialized if its value has not yet been read. See the [caching guide](../guides/caching.md) for details.
:::

It inherits all properties from [`State<T>`](#statet), and additionally defines:

- `[REFRESH_TAG]` - A function which refreshes the state.

  - When called on a **mounted** state, it re-evaluates the state immediately.
  - When called on an **unmounted** state, it marks it as **uninitialized** (meaning it will be re-evaluated the next time it's accessed).

  Important: This function is not meant to be called directly (see [utils](./utils.md)).
