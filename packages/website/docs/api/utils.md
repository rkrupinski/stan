---
sidebar_position: 6
description: Utils API reference
---

# Utils

## `reset`

Resets the [`WritableState<T>`](./state.md#writablestatet) to its default (initial) value.

Works with:

- [`atom`](./atom.md)
- [`atomFamily`](./atomFamily.md)

```ts
const reset: (state: WritableState<any>) => void;
```

## `refresh`

Refreshes the [`ReadonlyState<T>`](./state.md/#readonlystatet). This can mean different things depending on whether the state is [_mounted_](./state.md#mounting):

- Re-evaluates _mounted_ state immediately
- Marks _unmounted_ state for re-evaluation the next time it's read

Works with:

- [`selector`](./selector.md)
- [`selectorFamily`](./selectorFamily.md)

```ts
const refresh: (state: ReadonlyState<any>) => void;
```
