---
sidebar_position: 4
description: selector API reference
---

# `selector`

Among other things, selectors enable:

- Computing derived state:
  - synchronously or asynchronously
  - with updates triggered by changes in dependencies
  - as either a consumer or a dependency of other derived state
- Performing side effects, such as data fetching

```ts
const selector: <T>(
  selectorFn: SelectorFn<T>,
  options?: SelectorOptions,
) => Scoped<ReadonlyState<T>>;
```

- `selectorFn` - The function that produces the derived value (invoked every time the selector needs to re-evaluate). It has the following signature: `<T>(arg: { get: GetFn; signal: AbortSignal }) => T`, where:

  - `get` - A getter function used to consume the selector's dependencies ([atom](./atom.md)s or other selectors) or other selectors). Calling `get` with a [`State`](./state.md#statet) instance adds that state to the selector's dependency set, meaning the selector will re-evaluate whenever that state changes.

    :::info
    The dependency graph in Stan is dynamic, meaning `get` can also be called conditionally. The order of calls doesn't matter either. Stan will update the dependency graph and unsubscribe from dependencies that are no longer needed.
    :::

  - `signal` - An [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) instance associated with the current `selectorFn` call. The next time `selectorFn` is called, the `signal` from the previous call will be aborted (using an instance of `Aborted`, a Stan-specific subclass of `Error`). This is useful for canceling ongoing work, such as HTTP requests.

- `options?` - Selector configuration:

  - `tag?` - A string that gets appended to the `key` (see [`State<T>`](./state.md#statet)). Useful for debugging.
  - `areValuesEqual?` - A function used to determine whether two consecutive selector values are equal. It has the following signature: `<T>(a: T, b: T) => boolean`, and defaults to a simple `a === b` check. If this function returns `true` (or any other truthy value) upon computing the selector's value, the value is considered unchanged, and no subscribers will be notified.

    :::info
    `areValuesEqual` is expected to be synchronous.

    This means, in particular, that a `Promise` returned from an asynchronous selector will (by default) always be considered a different value unless:

    - it is the exact same `Promise` (reference equality), or
    - it can be determined synchronously (e.g., `(a, b) => a.prop === b.prop`) that the values are effectively the same.
      :::

    In general, `areValuesEqual` should be considered a cheap, simple optimization - nothing more.

## Example

Add two numbers:

```ts
const sum = selector(() => 40 + 2);
```

Add two dynamic numbers:

```ts
const num1 = atom(40);
const num2 = atom(2);

const sum = selector(({ get }) => get(num1) + get(num2));
```

Add two dynamic async numbers:

```ts
const num1 = selector(() => getNum1());
const num2 = selector(() => getNum2());

const sum = selector(async ({ get }) => {
  const [n1, n2] = await Promise.all([get(num1), get(num2)]);

  return n1 + n2;
});
```

Render with React:

```ts
const MyComponent: FC = () => {
  const result = useStanValueAsync(sum);

  switch (result.type) {
    case 'loading':
      return <p>Loading&hellip;</p>;

    case 'error':
      return <p>Nope</p>;

    case 'ready':
      return <p>{result.value}</p>;
  }
};
```

## See also

- [`selectorFamily`](./selectorFamily.md)
- [Using Stan with React](./react.md)
- [Aborting work](https://github.com/rkrupinski/stan/tree/master/packages/examples/aborting-work) (example)
- [Asynchronous state](https://github.com/rkrupinski/stan/tree/master/packages/examples/asynchronous-state) (example)
- [Dynamic dependencies](https://github.com/rkrupinski/stan/tree/master/packages/examples/dynamic-dependencies) (example)
