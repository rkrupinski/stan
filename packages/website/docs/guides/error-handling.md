---
sidebar_position: 2
description: How Stan handles (and doesn't handle) errors
---

# Error handling

This section explains how Stan stores and handles data, and the implications of these design decisions on error handling.

## Good ol' try-catch

One of the major differences between Stan and libraries like [Recoil](https://recoiljs.org/) or [Jotai](https://jotai.org) is its approach to [`Suspense`](https://react.dev/reference/react/Suspense). While Stan is still _Suspense-enabled_ (see the [react-suspense](https://github.com/rkrupinski/stan/tree/master/packages/examples/react-suspense) example), it is framework-agnostic and does not assume it's running in a React context (no pun intended). In particular, this means that `get` calls (when accessing a [`selector`](../api/selector.md)'s dependencies) won't throw, allowing for more natural and idiomatic error handling:

```ts
declare const dep: Scoped<ReadonlyState<Promise<number>>>;

const mySelector = selector(async ({ get }) => {
  try {
    const result = await get(dep); // This will only throw on an actual error

    return result;
  } catch {
    return 'nope';
  }
}); // Scoped<ReadonlyState<Promise<number | "nope">>>
```

## Async errors

Stan does not implement any internal abstraction around [state](../api/state.md) values. Everything is stored as-is and receives no special treatment, with one small exception: rejected `Promise`s.

When a Stan state satisfies the `Scoped<ReadonlyState<PromiseLike<any>>>` constraint - or, in simpler terms, when a [`selector`](../api/selector.md) returns something that looks like a `Promise` - and that `Promise` is rejected, Stan won't cache it. This means the state will be re-evaluated the next time it's accessed. This behavior is best illustrated by the [error-handling](https://github.com/rkrupinski/stan/tree/master/packages/examples/error-handling) example.
