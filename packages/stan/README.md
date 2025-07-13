[![](../website/static/img/logo.svg)](https://rkrupinski.github.io/stan)

# Stan

[![CI](https://github.com/rkrupinski/stan/actions/workflows/ci.yml/badge.svg)](https://github.com/rkrupinski/stan/actions/workflows/ci.yml)
[![Bundle size](https://badgen.net/bundlephobia/minzip/@rkrupinski/stan)](https://bundlephobia.com/package/@rkrupinski/stan)

Minimal, type-safe state management

[🌐 Website](https://rkrupinski.github.io/stan) &nbsp;&nbsp;|&nbsp;&nbsp;
[📘 API docs](https://rkrupinski.github.io/stan/docs/api/state) &nbsp;&nbsp;|&nbsp;&nbsp;
[📝 Examples](https://rkrupinski.github.io/stan/docs/getting-started/examples) &nbsp;&nbsp;|&nbsp;&nbsp;
[📰 Blog Post](https://rkrupinski.com/post/introducing-stan)

A sneak peek:

```tsx
import { selectorFamily } from '@rkrupinski/stan';
import { useStanValue } from '@rkrupinski/stan/react';

const deepThought = selectorFamily<string, string>(
  question => () => thinkDeep(question),
);

const MyApp: FC<{ question: string }> = ({ question }) => {
  const answer = useStanValue(deepThought(question));

  return (
    <p>
      The Answer to "{question}" is "{answer}"!
    </p>
  );
};
```
