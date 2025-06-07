---
sidebar_position: 5
description: selectorFamily API reference
---

# `selectorFamily`

Similarly to [`atomFamily`](./atomFamily.md), the use case for `selectorFamily` is mapping values to Stan primitives. It returns a memoized function that produces [`selectors`](./selector.md) based on a given parameter (which must be [serializable](../guides/param-serialization.md)).

Among other things, it can be especially useful for:

- Building selectors with context-dependent behavior
- Memoizing selectors that perform expensive computations, make API calls, and so on

```ts
const selectorFamily: <T, P extends SerializableParam>(
  selectorFamilyFn: SelectorFamilyFn<T, P>,
  options?: SelectorFamilyOptions<P>,
) => (param: P) => Scoped<ReadonlyState<T>>;
```

- `selectorFamilyFn` - A function with the following signature: `<T, P extends SerializableParam>(param: P) => SelectorFn<T>`. It takes one serializable parameter and returns a selector function (see [`selector`](./selector.md) for details).
- `options?` - Selector family configuration:
  - `tag?` - A string identifier (see [`selector`](./selector.md) for details). Alternatively, it can be a function with the following signature: `<P extends SerializableParam>(param: P) => string`. The function form is useful when the tag should depend on the parameter.
  - `areValuesEqual?` - A function used to determine whether two consecutive selector values are equal (see [`selector`](./selector.md) for details).
  - `cachePolicy?` - Configures the behavior of the selector family [cache](../guides/caching.md). Possible values:
    - `{ type: 'keep-all' }` _(default)_ - A selector instance will be cached for every parameter.
    - `{ type: 'most-recent' }` - Only the last parameter's selector instance will be cached.
    - `{ type: 'lru'; maxSize: number }` - Only the most recent `maxSize` selector instances will be cached.

:::info
Stan does not rely on referential equality for `selectorFamily` parameters, so there's no need to maintain stable references. Cache keys are computed by serializing (stable stringification) the parameter values - hence the [serializability](../guides/param-serialization.md) requirement.
:::

## Example

Get user by id:

```ts
const userById = selectorFamily<Promise<User>, string>(
  userId => () => getUser(userId),
);
```

Same, but abort the pending request:

```ts
const userById = selectorFamily<Promise<User>, string>(
  userId =>
    ({ signal }) =>
      getUser(userId, { signal }),
);
```

Same, but let's cache only up to 5 requests:

```ts
const userById = selectorFamily<Promise<User>, string>(
  userId =>
    ({ signal }) =>
      getUser(userId, { signal }),
  {
    cachePolicy: {
      type: 'lru',
      maxSize: 5,
    },
  },
);
```

Map the result to a different value:

```ts
const userNameById = selectorFamily<Promise<string>, string>(
  userId =>
    async ({ get }) => {
      const { name } = await get(userById(userId));

      return name;
    },
);
```

Render with React:

```tsx
const MyComponent: FC<{ userId: string }> = ({ userId }) => {
  const result = useStanValueAsync(userNameById(userId));

  switch (result.type) {
    case 'loading':
      return <p>Loading&hellip;</p>;

    case 'error':
      return <p>Nope</p>;

    case 'ready':
      return <p>Name: {result.value}</p>;
  }
};
```

## See also

- [`selector`](./selector.md)
- [Using Stan with React](./react.md)
- [Caching](https://github.com/rkrupinski/stan/tree/master/packages/examples/caching) (example)
