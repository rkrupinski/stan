---
sidebar_position: 1
description: Make state type-safe again
---

# Type safety

Stan harnesses the power of advanced [type inference](https://www.typescriptlang.org/docs/handbook/type-inference.html) to deliver an excellent developer experience. In practice, this means that manual type annotations are often unnecessary - type safety is maintained because the compiler can infer the necessary information directly from the code.

Consider the following code snippets:

```ts
const atomA = atom(42); // Scoped<WritableState<number>>

const atomB = atom({ foo: 'bar' }); // Scoped<WritableState<{ foo: string }>>

const selectorA = selector(({ get }) => get(atomA)); // Scoped<ReadonlyState<number>>

const selectorB = selector(({ get }) => {
  if (Math.random() > 0.5) return get(atomA);

  return get(atomB).foo;
}); // Scoped<ReadonlyState<string | number>>
```

Whether it's a simple `atom`, or a `selector` with a random control flow, TypeScript is able to correctly infer the type of it. However, the compiler can only infer information from the hints we give it. If the hints are low-resolution, so is the inferred type, which simply gets widened:

Whether it's a simple [`atom`](../api/atom.md) or a [`selector`](../api/selector.md) with complex control flow, TypeScript can correctly infer its type. However, the compiler can only infer information based on the hints we provide. If those hints are vague or low-resolution, the inferred type will be too - typically resulting in type widening:

- `42` → `number`
- `'bar'` → `string`

Luckily, refining the type hints for the compiler doesn't take much effort:

```ts
const atomA = atom<42 | 43>(42); // Scoped<WritableState<42 | 43>>

const atomB = atom<{ foo: 'bar' | 'baz' }>({ foo: 'bar' }); // Scoped<WritableState<{ foo: "bar" | "baz" }>>

const selectorA = selector(({ get }) => get(atomA)); // Scoped<ReadonlyState<42 | 43>>

const selectorB = selector(({ get }) => {
  if (Math.random() > 0.5) return get(atomA);

  return get(atomB).foo;
}); // Scoped<ReadonlyState<42 | 43 | "bar" | "baz">>
```

There will also be situations where the compiler can only perform partial inference:

```ts
const scores = atomFamily(0); // (arg: Json) => Scoped<WritableState<number>>

const users = selectorFamily(userId => () => getUser(userId)); // (arg: Json) => Scoped<ReadonlyState<Promise<User>>>
```

The parameters of [`atomFamily`](../api/atomFamily.md) and [`selectorFamily`](../api/selectorFamily.md) must be [serializable](./param-serialization.md) - there's no context for inferring their types, so they default to being inferred as `Json`. But even that is just as easily fixable:

```ts
const scores = atomFamily<number, string>(0); // (arg: string) => Scoped<WritableState<number>>

const users = selectorFamily<Promise<User>, string>(
  userId => () => getUser(userId),
); // (arg: string) => Scoped<ReadonlyState<Promise<User>>>
```
