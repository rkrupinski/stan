# Stan

[![CI](https://github.com/rkrupinski/stan/actions/workflows/ci.yml/badge.svg)](https://github.com/rkrupinski/stan/actions/workflows/ci.yml)
![Bundle size](https://badgen.net/bundlephobia/minzip/@rkrupinski/stan)

Minimal, type-safe state management

- [Website](https://rkrupinski.github.io/stan)
- [API docs](https://rkrupinski.github.io/stan/docs/api)
- [Examples](https://github.com/rkrupinski/stan/tree/master/packages/examples)

```tsx
import { atom } from "@rkrupinski/stan";
import { useStanValue } from "@rkrupinski/stan/react";

const salary = atom(21);
const bonus = atom(37);
const total = selector(({ get }) => get(salary) + get(bonus));

const TotalSalary = () => {
  const value = useStanValue(total);

  return <small>{value}</small>;
};
```
