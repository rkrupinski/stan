---
sidebar_position: 3
description: Explore different layers of Stan cache
---

# Caching

As Albert Einstein once said, there are only two hard problems in computer science:

- Naming things
- Cache invalidation
- Off-by-one errors

I'm not entirely sure what he meant, but let's talk about caching. Unlike [Jotai](https://jotai.org), which doesn't really care about caching out of the box, or [Recoil](https://recoiljs.org/), which caches very aggressively until you opt out, Stan takes a more balanced approach - somewhere between the two. Below, you'll find a rundown of all layers of Stan's cache.

## `atom`

Once initialized, the [`atom`](../api/atom.md)'s value is cached. Until it is updated or [reset](../api/utils.md#reset), subscribers won't be notified, and all read attempts will return the cached value.

:::info
The `atom`'s lifecycle is heavily influenced by the `areValuesEqual` setting (see the [`atom`](../api/atom.md) documentation). If the new value is considered equal, the cache entry is not replaced, and no change is propagated.
:::

## `atomFamily`

The `atomFamily` helper returns a memoized function that maps [serializable](../guides/param-serialization.md) parameters to `atom`s. For several reasons (e.g., avoiding re-running [atom effects](../api/atom.md#atom-effects)), the cache size is not limited. Every new parameter - or more precisely, every parameter that serializes to a different string - adds a new `atom` to the cache. There is no difference between "standalone" `atom`s and those produced by `atomFamily` - the same caching rules apply to both.

## `selector`

The caching rules for a `selector` are somewhat similar to those of an `atom`. Once initialized (when the `selector` function is first evaluated), the returned value is stored in the cache and remains there until it either changes or the `selector` is [refreshed](../api/utils.md#refresh). The difference is what triggers a `selector` change - it can only happen when one of its dependencies changes (dependencies are consumed via `get` calls).

:::info
The `selector`'s lifecycle is heavily influenced by the `areValuesEqual` setting (see the [`selector`](../api/selector.md) documentation). If the new value is considered equal, the cache entry is not replaced, and no change is propagated.
:::

## `selectorFamily`

The `selectorFamily` helper returns a memoized function that maps [serializable](../guides/param-serialization.md) parameters to `selector`s. Unlike `atomFamily`, it allows configuring cache behavior via the `cachePolicy` setting (see the [`selectorFamily`](../api/selectorFamily.md) documentation). Once a `selector` is removed from the cache (e.g., due to hitting the size limit), it's as if it never existed. There is no difference between "standalone" `selector`s and those produced by `selectorFamily` - the same caching rules apply to both.
