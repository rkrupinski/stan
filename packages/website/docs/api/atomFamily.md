---
sidebar_position: 3
description: atomFamily API reference
---

# `atomFamily`

When you need to map a values to atoms, `atomFamily` comes in handy. It returns a memoized function that outputs atoms based on the provided parameter (which must be [serializable](../guides//param-serialization.md)).

```ts
const atomFamily: <T, P extends SerializableParam>(
  initialValue: T | ValueFromParam<T, P>,
  options?: AtomFamilyOptions<T, P>,
) => (param: P) => Scoped<WritableState<T>>;
```

- `initialValue` - The value used to initialize the atom. It can also be a function with the following signature: `<T, P extends SerializableParam>(param: P) => T`. This function form is useful when initializing atoms with different values based on the parameter.
- `options?` - Atom family configuration:
  - `tag?` - A string identifier (see [`atom`](./atom.md) for details). Alternatively, it can be a function with the following signature: `<P extends SerializableParam>(param: P) => string`. The function form is useful when the tag should depend on the parameter.
  - `effects?` - An array of [`AtomEffect<T>`](./atom.md#atom-effects).
  - `areValuesEqual?` - A function that determines whether two consecutive values are equal (see [`atom`](./atom.md) for details).

:::info
Stan does not rely on referential equality for `atomFamily` parameters, so there's no need to maintain stable references. Cache keys are computed by serializing (stable stringification) the parameter values - hence the [serializability](../guides//param-serialization.md) requirement.
:::

## Example

Track score per `userId`:

```ts
const scores = atomFamily<number, string>(0);
```

Track score per `User`, starting from an initial value:

```ts
type User = {
  id: string;
  score: number;
};

const scores = atomFamily<number, User>(user => user.score);
```

Increase the score using React:

```tsx
const Scoreboard: FC<{ user: User }> = ({ user }) => {
  const [score, setScore] = useStan(scores(user));

  return (
    <>
      <h1>{score}</h1>
      <button onClick={() => setScore(prev => prev + 1)}>+</button>
    </>
  );
};
```

## See also

- [`atom`](./atom.md)
- [Using Stan with React](./react.md)
