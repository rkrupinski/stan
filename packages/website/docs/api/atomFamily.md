---
sidebar_position: 3
description: atomFamily API reference
---

# `atomFamily`

When you need to map a value to atoms, `atomFamily` comes in handy. It returns a memoized function that produces atoms based on the provided parameter (which must be serializable).

```ts
const atomFamily: <T, P extends SerializableParam>(
  initialValue: T | ValueFromParam<T, P>,
  options?: AtomFamilyOptions<T, P>,
) => (param: P) => Scoped<WritableState<T>>;
```

- `initialValue` – The value used to initialize the atom. It can also be a function with the following signature: `<T, P extends SerializableParam>(param: P) => T`. The function form is useful for initializing atoms with different values based on the parameter.
- `options?` - Atom family configuration:
  - `tag?` - A string identifier (see [`State<T>`](./state.md#statet)). Alternatively, it can be a function with the following signature: `<P extends SerializableParam>(param: P) => string`. The function form is useful when the tag should depend on the parameter.
  - `effects?` - An array of [`AtomEffect<T>`](./atom.md#atom-effects).

:::info
Stan does not rely on referential equality for `atomFamily` parameters, so there's no need to maintain a stable reference. Cache keys are computed by serializing the parameter values - hence the requirement for parameters to be serializable.
:::

## Examples

React point counter:

```tsx
const points = atomFamily(0);

const PointCounter: FC<{ userId: string }> = ({ userId }) => {
  const [value, setValue] = useStan(points(userId));

  return (
    <>
      <h1>{value}</h1>
      <button onClick={() => setValue(prev => prev + 1)}>+</button>
    </>
  );
};
```

React point counter with initial value:

```tsx
type User = {
  id: string;
  points: number;
};

const points = atomFamily<number, User>(user => user.points);

const PointCounter: FC<{ user: User }> = ({ user }) => {
  const [value, setValue] = useStan(points(user));

  return (
    <>
      <h1>{value}</h1>
      <button onClick={() => setValue(prev => prev + 1)}>+</button>
    </>
  );
};
```

## See also

- [Using Stan with React](./react.md)
