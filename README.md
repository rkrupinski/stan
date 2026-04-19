[![](packages/website/static/img/logo.svg)](https://stan.party)

# Stan

[![CI](https://github.com/rkrupinski/stan/actions/workflows/ci.yml/badge.svg)](https://github.com/rkrupinski/stan/actions/workflows/ci.yml)
![NPM Version](https://img.shields.io/npm/v/@rkrupinski/stan)
![Bundle size](https://img.shields.io/bundlejs/size/@rkrupinski/stan)

Minimal, type-safe state management

- [Website](https://stan.party)
- [API docs](https://stan.party/docs/api/state)
- [Examples](https://stan.party/docs/getting-started/examples)
- [Devtools](https://chromewebstore.google.com/detail/stan-devtools/jioipgcofbmgbdfmdjjcmockkjkhagac)
- [Blog Post](https://rkrupinski.com/post/introducing-stan)

## Install

```sh
npm install @rkrupinski/stan
```

## Quick start

Stan is framework-agnostic. This example uses React — see [Frameworks](https://stan.party/docs/getting-started/frameworks) for the rest.

```jsx
import { atom, selector } from "@rkrupinski/stan";
import { useStan, useStanValue } from "@rkrupinski/stan/react";

const count = atom(0);
const doubled = selector(({ get }) => get(count) * 2);

function Counter() {
  const [value, setValue] = useStan(count);
  const double = useStanValue(doubled);

  return (
    <>
      <button onClick={() => setValue(v => v + 1)}>Count: {value}</button>
      <p>Doubled: {double}</p>
    </>
  );
}
```
