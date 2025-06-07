---
sidebar_position: 1
description: State API reference
---

# State

At the core of Stan is state. All Stan APIs either create, update, or consume state. To keep things interesting, there are actually different types of state. Stan represents them as follows:

```ts
interface State<T> {
  key: string;
  get(): T;
  subscribe(callback: (value: T) => void): () => void;
}

interface ReadonlyState<T> extends State<T> {
  [REFRESH_TAG](): void;
}

interface WritableState<T> extends State<T> {
  set: SetterOrUpdater<T>;
  [RESET_TAG](): void;
}
```

Stan does not care about the type of value being stored, nor does it behave differently depending on the value type (with one small exception - see the [error handling guide](../guides/error-handling.md)).

## `State<T>`

Nothing in Stan directly produces `State<T>`, but all other state types inherit from it.

It comes with the following properties:

- `key` - A unique string identifier used by Stan internally. To facilitate debugging, it can be partially customized via the `tag` option (see [atom](./atom.md) &amp; [selector](./selector.md)).
- `get` - A function that returns the current state value.
- `subscribe` - Allows listening for state changes. It takes a callback function that's called with the new value and returns an unsubscribe function.

## `WritableState<T>`

Produced by:

- [`atom`](./atom.md)
- [`atomFamily`](./atomFamily.md)

This is a state that can be both read from and written to. It is eagerly evaluated.

It inherits all properties from [`State<T>`](#statet), and additionally defines:

- `set` - A function for updating the state value.
- `[RESET_TAG]` - A function that resets the state.

  - Reverts the state value to its default.
  - Notifies all subscribers about the change.

  Important: This function is not meant to be called directly (see [utils](./utils.md#reset)).

:::info
`WritableState<T>` must be initialized before use. Initialization occurs when the state is first read.
:::

## `ReadonlyState<T>`

Produced by:

- [`selector`](./selector.md)
- [`selectorFamily`](./selectorFamily.md)

As the name implies, this is a state that can only be read from. However, that doesn't mean it cannot change — it absolutely can:

- When it's refreshed (see [utils](./utils.md#refresh))
- When its dependencies change (see [`selector`](./selector.md))
- When its input changes (see [`selectorFamily`](./selectorFamily.md))

It inherits all properties from [`State<T>`](#statet), and additionally defines:

- `[REFRESH_TAG]` - A function that refreshes the state.

  - When called on a _mounted_ state, it re-evaluates the state immediately.
  - When called on an _unmounted_ state, it marks the state as uninitialized - meaning it will be re-evaluated the next time it is accessed.

  Important: This function is not meant to be called directly (see [utils](./utils.md#refresh)).

:::info
`ReadonlyState<T>` must be initialized before use. Initialization occurs when the state is first read.
:::

### Mounting

`ReadonlyState<T>` is considered _mounted_ when it has one or more subscribers, and _unmounted_ when it has none. This affects how the state is refreshed (see [utils](./utils.md#refresh)).
