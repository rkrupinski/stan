[![](../website/static/img/logo.svg)](https://rkrupinski.github.io/stan)

# Stan

[![CI](https://github.com/rkrupinski/stan/actions/workflows/ci.yml/badge.svg)](https://github.com/rkrupinski/stan/actions/workflows/ci.yml)
[![Bundle size](https://badgen.net/bundlephobia/minzip/@rkrupinski/stan)](https://bundlephobia.com/package/@rkrupinski/stan)

Minimal, type-safe state management

- [Website](https://rkrupinski.github.io/stan)
- [API docs](https://rkrupinski.github.io/stan/docs/api)
- [Examples](https://rkrupinski.github.io/stan/docs/getting-started/examples)

```tsx
import { atom } from '@rkrupinski/stan';
import { useStanValue } from '@rkrupinski/stan/react';

const ultimateQuestion = atom(42);

function MyApp() {
  const answer = useStanValue(ultimateQuestion);

  return <h1>{answer}</h1>;
}
```
