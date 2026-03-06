---
sidebar_position: 6
description: Debugging Stan
---

# Debugging

When debugging Stan with the [DevTools](../getting-started/devtools.md) extension, do yourself a favor and tag your state. While tagging is not mandatory - Stan will assign tags automatically:

```ts
atom('all'); // 'Atom 1'
atom([]); // 'Atom 2'
selector(fn); // 'Selector 1'
```

Wouldn't it be nicer to have state show up in DevTools with meaningful labels you can filter by?

```ts
atom('all', { tag: 'View' });
atom([], { tag: 'Todos' });
selector(fn, { tag: 'Filtered todos' });
```

One special case is state families ([`atomFamily`](../api/atomFamily.md) &amp; [`selectorFamily`](../api/selectorFamily.md)). Because families in Stan map input to state, a string tag (though possible) may not be the best idea. Consider the function form instead:

```ts
const searchResults = selectorFamily<Promise<SearchResult[]>, string>(
  phrase => () => getResults(phrase),
  { tag: phrase => `Search results for: ${phrase}` },
);
```
