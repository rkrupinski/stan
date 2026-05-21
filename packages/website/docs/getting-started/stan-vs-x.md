---
sidebar_position: 6
description: Side-by-side comparison of Stan and other popular state-management libraries - bundle size, framework support, caching, update granularity, and DevTools.
---

# Stan vs. X

Here's how Stan stacks up against other popular state-management libraries.

| Library                                       | Model                                                 | Bundle  | Framework support                                                  | Caching                                                 | Update granularity               | DevTools                                        | Alive |
| --------------------------------------------- | ----------------------------------------------------- | ------- | ------------------------------------------------------------------ | ------------------------------------------------------- | -------------------------------- | ----------------------------------------------- | ----- |
| **Stan**                                      | Atoms + selectors as scoped factory functions         | 2.2 KB  | Framework-agnostic (React and Vue adapters today; more on the way) | `selectorFamily`: `keep-all`, `most-recent`, `lru`, TTL | Fine-grained                     | Dedicated Chrome extension                      | ✅    |
| [Recoil](https://recoiljs.org)                | Atoms + selectors                                     | 22.7 KB | React only                                                         | `selectorFamily` cache policies                         | Fine-grained                     | No official extension                           | ❌    |
| [Jotai](https://jotai.org)                    | Atomic, bottom-up composition for React               | 3.8 KB  | React only                                                         | Atom-level memoization; `atomFamily` by param           | Fine-grained                     | `jotai-devtools` package (no browser extension) | ✅    |
| [Zustand](https://zustand.docs.pmnd.rs)       | Single hook-based store with slices                   | 0.5 KB  | React-first; framework-agnostic core via `zustand/vanilla`         | Not built-in (user-managed)                             | Store-level (slice selectors)    | Via Redux DevTools middleware                   | ✅    |
| [Redux Toolkit](https://redux-toolkit.js.org) | Single store, actions, reducers (Flux)                | 13.3 KB | Framework-agnostic; React via `react-redux`                        | Via `createSelector` (re-exported from `reselect`)      | Store-level (memoized selectors) | Redux DevTools (browser extension)              | ✅    |
| [TanStack Store](https://tanstack.com/store)  | Immutable reactive store with computed derived values | 2.2 KB  | Framework-agnostic (React, Vue, Solid, Svelte, Angular adapters)   | Auto-tracked derivations; no formal cache policies      | Fine-grained                     | In alpha                                        | ✅    |

_Bundle sizes are from [Bundlephobia](https://bundlephobia.com) (min+gzip, core package only)._

## Benchmark

Stan ships with a basic [benchmark](https://github.com/rkrupinski/stan/tree/master/packages/benchmark) script. Of course, benchmarks are flawed, real-world usage differs from synthetic tests, and the Earth might even be flat - but at least this gives you some kind of reference point. The exact numbers are below:

```
Stan vanilla benchmark - Stan vs. Jotai vs. Zustand
Node v22.22.0 · darwin/arm64
NODE_ENV=production

▶ s1: baseline: atom set + read
┌─────────┬─────────────────────────────┬───────────┬──────────────┬───────────┬──────────┬──────────┬─────────┐
│ (index) │ Scenario                    │ Library   │ ops/sec      │ mean (μs) │ p99 (μs) │ samples  │ vs Stan │
├─────────┼─────────────────────────────┼───────────┼──────────────┼───────────┼──────────┼──────────┼─────────┤
│ 0       │ 'baseline: atom set + read' │ 'stan'    │ '7,394,894'  │ '0.14'    │ '0.17'   │ 7188147  │ '-'     │
│ 1       │ 'baseline: atom set + read' │ 'jotai'   │ '1,270,203'  │ '0.81'    │ '0.96'   │ 1240128  │ '0.17×' │
│ 2       │ 'baseline: atom set + read' │ 'zustand' │ '23,509,976' │ '0.04'    │ '0.08'   │ 22302038 │ '3.18×' │
└─────────┴─────────────────────────────┴───────────┴──────────────┴───────────┴──────────┴──────────┴─────────┘

▶ s2: deep selector chain (depth 50)
┌─────────┬──────────────────────────────────┬───────────┬──────────┬───────────┬──────────┬─────────┬─────────┐
│ (index) │ Scenario                         │ Library   │ ops/sec  │ mean (μs) │ p99 (μs) │ samples │ vs Stan │
├─────────┼──────────────────────────────────┼───────────┼──────────┼───────────┼──────────┼─────────┼─────────┤
│ 0       │ 'deep selector chain (depth 50)' │ 'stan'    │ '21,111' │ '53.26'   │ '62.38'  │ 18788   │ '-'     │
│ 1       │ 'deep selector chain (depth 50)' │ 'jotai'   │ '18,641' │ '64.63'   │ '999.89' │ 15472   │ '0.88×' │
│ 2       │ 'deep selector chain (depth 50)' │ 'zustand' │ 'n/a'    │ 'n/a'     │ 'n/a'    │ 0       │ 'n/a'   │
└─────────┴──────────────────────────────────┴───────────┴──────────┴───────────┴──────────┴─────────┴─────────┘

▶ s3: wide fan-out (200 leaves)
┌─────────┬─────────────────────────────┬───────────┬──────────┬───────────┬──────────┬─────────┬─────────┐
│ (index) │ Scenario                    │ Library   │ ops/sec  │ mean (μs) │ p99 (μs) │ samples │ vs Stan │
├─────────┼─────────────────────────────┼───────────┼──────────┼───────────┼──────────┼─────────┼─────────┤
│ 0       │ 'wide fan-out (200 leaves)' │ 'stan'    │ '11,697' │ '99.94'   │ '964.00' │ 10006   │ '-'     │
│ 1       │ 'wide fan-out (200 leaves)' │ 'jotai'   │ '3,859'  │ '276.89'  │ '807.81' │ 3612    │ '0.33×' │
│ 2       │ 'wide fan-out (200 leaves)' │ 'zustand' │ 'n/a'    │ 'n/a'     │ 'n/a'    │ 0       │ 'n/a'   │
└─────────┴─────────────────────────────┴───────────┴──────────┴───────────┴──────────┴─────────┴─────────┘

▶ s4: diamond (shared dep coalescing)
┌─────────┬───────────────────────────────────┬───────────┬───────────┬───────────┬──────────┬─────────┬─────────┐
│ (index) │ Scenario                          │ Library   │ ops/sec   │ mean (μs) │ p99 (μs) │ samples │ vs Stan │
├─────────┼───────────────────────────────────┼───────────┼───────────┼───────────┼──────────┼─────────┼─────────┤
│ 0       │ 'diamond (shared dep coalescing)' │ 'stan'    │ '535,926' │ '2.18'    │ '2.58'   │ 457723  │ '-'     │
│ 1       │ 'diamond (shared dep coalescing)' │ 'jotai'   │ '243,124' │ '4.50'    │ '5.33'   │ 222211  │ '0.45×' │
│ 2       │ 'diamond (shared dep coalescing)' │ 'zustand' │ 'n/a'     │ 'n/a'     │ 'n/a'    │ 0       │ 'n/a'   │
└─────────┴───────────────────────────────────┴───────────┴───────────┴───────────┴──────────┴─────────┴─────────┘

▶ s5: 100 independent atoms, sequential writes per tick
┌─────────┬─────────────────────────────────────────────────────┬───────────┬──────────┬────────────┬────────────┬─────────┬─────────┐
│ (index) │ Scenario                                            │ Library   │ ops/sec  │ mean (μs)  │ p99 (μs)   │ samples │ vs Stan │
├─────────┼─────────────────────────────────────────────────────┼───────────┼──────────┼────────────┼────────────┼─────────┼─────────┤
│ 0       │ '100 independent atoms, sequential writes per tick' │ 'stan'    │ '64,865' │ '15.52'    │ '17.83'    │ 64413   │ '-'     │
│ 1       │ '100 independent atoms, sequential writes per tick' │ 'jotai'   │ '12,462' │ '81.41'    │ '140.04'   │ 12284   │ '0.19×' │
│ 2       │ '100 independent atoms, sequential writes per tick' │ 'zustand' │ '850'    │ '1,176.99' │ '1,276.44' │ 850     │ '0.01×' │
└─────────┴─────────────────────────────────────────────────────┴───────────┴──────────┴────────────┴────────────┴─────────┴─────────┘

▶ s6: derived read (cache hit, deps unchanged)
┌─────────┬────────────────────────────────────────────┬───────────┬──────────────┬───────────┬──────────┬──────────┬─────────┐
│ (index) │ Scenario                                   │ Library   │ ops/sec      │ mean (μs) │ p99 (μs) │ samples  │ vs Stan │
├─────────┼────────────────────────────────────────────┼───────────┼──────────────┼───────────┼──────────┼──────────┼─────────┤
│ 0       │ 'derived read (cache hit, deps unchanged)' │ 'stan'    │ '24,029,914' │ '0.04'    │ '0.04'   │ 25657436 │ '-'     │
│ 1       │ 'derived read (cache hit, deps unchanged)' │ 'jotai'   │ '6,482,130'  │ '0.16'    │ '0.21'   │ 6261955  │ '0.27×' │
│ 2       │ 'derived read (cache hit, deps unchanged)' │ 'zustand' │ '33,188,094' │ '0.02'    │ '0.04'   │ 44058309 │ '1.38×' │
└─────────┴────────────────────────────────────────────┴───────────┴──────────────┴───────────┴──────────┴──────────┴─────────┘

▶ s7: atomFamily (1000 keys) - single-key update per tick
┌─────────┬───────────────────────────────────────────────────────┬───────────┬─────────────┬───────────┬──────────┬─────────┬─────────┐
│ (index) │ Scenario                                              │ Library   │ ops/sec     │ mean (μs) │ p99 (μs) │ samples │ vs Stan │
├─────────┼───────────────────────────────────────────────────────┼───────────┼─────────────┼───────────┼──────────┼─────────┼─────────┤
│ 0       │ 'atomFamily (1000 keys) - single-key update per tick' │ 'stan'    │ '2,631,200' │ '0.40'    │ '0.50'   │ 2488064 │ '-'     │
│ 1       │ 'atomFamily (1000 keys) - single-key update per tick' │ 'jotai'   │ '1,181,331' │ '0.88'    │ '1.08'   │ 1136014 │ '0.45×' │
│ 2       │ 'atomFamily (1000 keys) - single-key update per tick' │ 'zustand' │ 'n/a'       │ 'n/a'     │ 'n/a'    │ 0       │ 'n/a'   │
└─────────┴───────────────────────────────────────────────────────┴───────────┴─────────────┴───────────┴──────────┴─────────┴─────────┘
```
