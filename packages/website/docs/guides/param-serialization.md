---
sidebar_position: 4
description: Stan parameter serialization explained
---

# Param serialization

Everywhere Stan enforces the `SerializableParam` constraint on a value ([`atomFamily`](../api/atomFamily.md), [`selectorFamily`](../api/selectorFamily.md)), it means that the value will be used as a cache key. The process of computing cache keys must be **idempotent** (the same value should always produce the same key) and **stable** (reordering properties should not affect the result). As a result, not all values are acceptable.

Stan currently limits valid parameters to `JSON`-like values:

```ts
type Json =
  | string
  | number
  | boolean
  | null
  | { [property: string]: Json }
  | Json[];
```

This is illustrated in the following examples:

```ts
family(1); // Valid

family([1, 2, 3]); // Valid

family(function foo() {
  return 'bar';
}); // Invalid

family(Promise.resolve(1)); // Invalid
```

## See also

- [`atomFamily`](../api/atomFamily.md)
- [`selectorFamily`](../api/selectorFamily.md)
