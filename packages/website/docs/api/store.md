---
sidebar_position: 7
description: Store API reference
---

# Store

For several reasons (such as <abbr>SSR</abbr>), it's not a good idea for Stan to keep state locally. Instead, it uses a central store: every change is written to the store, and every value is read from it. However, the store-oriented design introduces some semantic overhead in the form of the [`Scoped<T>`](#scopedt) type.

## `Scoped<T>`

Rather than directly producing [state](./state.md), all Stan primitives ([`atom`](./atom.md), [`selector`](./selector.md), etc.) output memoized functions that map from [`Store`](#the-store-class) to [state](./state.md):

```ts
type Scoped<T extends State<any>> = (store: Store) => T;
```

That way, every piece of [state](./state.md) is "scoped" to a specific [`Store`](#the-store-class) instance. A change in the context of Store A doesn't exist in the context of Store B, and vice versa:

```ts
const myAtom = atom(42);

myAtom(storeA).get(); // 42

myAtom(storeA).set(prev => prev + 1);

myAtom(storeB).get(); // 42
```

:::info
Manually providing a [`Store`](#the-store-class) instance is only necessary when working with vanilla Stan. Framework bindings (like those for [React](./react.md)) handle this automatically, hiding the complexity entirely.
:::

## The `Store` class

While the `Store` class should be treated as opaque and its internals as implementation details, there may be situations where instantiating it is necessary. Stan provides several ways to do this:

- Manual: `new Store()`
- Using the `makeStore()` helper
- `DEFAULT_STORE`, the default instance used when working with [React](./react.md)

## See also

- [State](./state.md)
- [Using Stan with React](./react.md)
- [Vanilla](https://github.com/rkrupinski/stan/tree/master/packages/examples/vanilla) (example)
- [Switching stores](https://github.com/rkrupinski/stan/tree/master/packages/examples/switching-stores) (example)
