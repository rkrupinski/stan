---
sidebar_position: 2
---

# atom

In Stan, atoms are value containers. They have no dependencies and can be considered source vertices in the Stan state graph. `atom<T>` returns a [`WritableState<T>`](./state.md#writablestatet).

```ts
declare const atom: <T>(
  initialValue: T,
  options?: AtomOptions<T>,
) => WritableState<T>;
```

- `initialValue` – The value used to initialize the atom. While atoms can theoretically store values of any type, if you're thinking of using Promises, you'd likely be better off with a [`selector`](./selector.md).
- `options?` - Atom configuration:
  - `tag?` - A string identifier (see [`State<T>`](./state.md#statet)).
  - `effects?` - An array of [`AtomEffect<T>`](#atom-effects).

## Atom effects

Atom effects are an abstraction that allows for:

- Initializing atoms (e.g., from external storage)
- Executing code when an atom's value changes (e.g., saving the value to external storage)
- Setting an atom's value (e.g., in response to events)

There can be an arbitrary number of them, and they're processed in the order they were defined.

```ts
type AtomEffect<T> = (param: {
  init(value: T): void;
  set: SetterOrUpdater<T>;
  onSet(cb: (value: T) => void): void;
}) => void;
```

- `init` – A function used to initialize the atom's value. It can be called multiple times, but **only** synchronously, during the execution of the effect function. Any attempt to call it asynchronously will be ignored.
- `set` – A function used to update the atom's value. Unlike `init`, it is intended to be called asynchronously, after the initialization phase. Calling `set` from within the effect will not trigger `onSet`, but it will notify atom subscribers.
- `onSet` – A way to subscribe to atom value changes. It accepts a callback function that will be called with the new value, unless the change was triggered from within the effect using `set`.
