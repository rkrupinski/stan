---
sidebar_position: 4
description: selector API reference
---

# `selector`

Among other things, selectors enable:

- Computing derived state:
  - where a selector is either the consumer or a dependency of another selector
  - which may be synchronous or asynchronous
- Performing side effects, such as data fetching

```ts
const selector: <T>(
  selectorFn: SelectorFn<T>,
  selectorOptions?: SelectorOptions,
) => Scoped<ReadonlyState<T>>;
```

- `selectorFn` - A function with the following signature: `<T>(arg: { get: GetFn; signal: AbortSignal }) => T`, where:
  - `get` – A getter function for referencing the selector's dependencies ([atoms](./atom.md) or other selectors). Calling `get` with a [`State`](./state.md#statet) instance adds that state to the selector's dependencies, meaning the selector will re-evaluate whenever that state changes.
  - `signal` – An `AbortSignal` instance associated with the current `selectorFn` call. The next time `selectorFn` is called, the `signal` for the previous call will be aborted (using an instance of `Aborted`, a subclass of `Error`). This is useful for aborting ongoing work (see the [aborting-work](https://github.com/rkrupinski/stan/tree/master/packages/examples/aborting-work) example for details).
