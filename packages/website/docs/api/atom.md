---
sidebar_position: 2
description: atom API reference
---

# `atom`

In Stan, atoms are value containers. They have no dependencies and can be considered source vertices in the Stan state graph. They're designed for synchronous state but can theoretically work with any type of data (for async, make sure to check out [`selector`](./selector.md)).

```ts
const atom: <T>(
  initialValue: T,
  options?: AtomOptions<T>,
) => Scoped<WritableState<T>>;
```

- `initialValue` - The value used to initialize the atom.
- `options?` - Atom configuration:

  - `tag?` - A string that gets appended to the `key` (see [`State<T>`](./state.md#statet)). Useful for debugging.
  - `effects?` - An array of [`AtomEffect<T>`](#atom-effects).
  - `areValuesEqual?` - A function used to determine whether two consecutive atom values are equal. It has the following signature: `<T>(a: T, b: T) => boolean`, and defaults to a simple `a === b` check. If this function returns `true` (or any other truthy value) when setting the atom's value, the value is considered unchanged, and no subscribers will be notified.

    :::info
    `areValuesEqual` is expected to be synchronous.
    :::

## Atom effects

Atom effects are an abstraction that allows for:

- Initializing atoms (e.g., from external storage)
- Executing code when an atom's value changes (e.g., saving the value to external storage)
- Updating an atom's value (e.g., in response to events)

There can be any number of them, and they're processed in the order in which they were defined.

```ts
type AtomEffect<T> = (param: {
  init(value: T): void;
  set: SetterOrUpdater<T>;
  onSet(cb: (value: T) => void): void;
}) => void;
```

- `init` - A function used to initialize the atom's value. It can be called multiple times, but **only** synchronously, during the execution of the effect function. Any attempt to call it asynchronously will be ignored.
- `set` - A function used to update the atom's value. Unlike `init`, it is intended to be called asynchronously, after the initialization phase. Calling `set` from within the effect will not trigger `onSet`, but it will notify atom subscribers.
- `onSet` - A way to subscribe to atom value changes. It accepts a callback function that will be called with the new value, unless the change was triggered from within the effect using `set`.

## Example

Creating an atom that holds a state of type `number`:

```ts
const myAtom = atom(42);
```

Adding a simple logger:

```ts
const myAtom = atom(42, {
  effects: [
    ({ onSet }) => {
      onSet(newValue => {
        console.log('value changed:', newValue);
      });
    },
  ],
});
```

Reading and writing an atom value in React:

```tsx
function MyComponent() {
  const [value, setValue] = useStan(myAtom);

  return (
    <input
      type="number"
      value={value}
      onChange={e => setValue(e.target.valueAsNumber)}
    />
  );
}
```

## See also

- [`atomFamily`](./atomFamily.md)
- [Using Stan with React](./react.md)
- [Atom effects](https://github.com/rkrupinski/stan/tree/master/packages/examples/atom-effects) (example)
