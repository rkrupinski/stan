---
sidebar_position: 5
description: Using Stan with Server-Side Rendering
---

# SSR

This section explains how to use Stan with <abbr>SSR</abbr> across different frameworks.

## React / Next.js

While Stan can work in provider-less mode (in which it simply uses the [`DEFAULT_STORE`](../api/store.md#the-store-class)), one needs a way to scope and isolate state per request during server-side rendering. That can be done via wrapping the root of the app (`app/layout.tsx`) in `StanProvider`:

```tsx
import { StanProvider } from '@rkrupinski/stan/react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <StanProvider>{children}</StanProvider>
      </body>
    </html>
  );
}
```

## Vue / Nuxt

The same applies to Vue: to scope and isolate state per request during server-side rendering, wrap the root of your app in `StanProvider` - or call `provideStan` in its `setup()`:

```vue
<script setup lang="ts">
import { StanProvider } from '@rkrupinski/stan/vue';
</script>

<template>
  <StanProvider>
    <slot />
  </StanProvider>
</template>
```

Or, equivalently:

```vue
<script setup lang="ts">
import { provideStan } from '@rkrupinski/stan/vue';

provideStan();
</script>

<template>
  <slot />
</template>
```

## See also

- [Using Stan with React](../api/react.md)
- [Using Stan with Vue](../api/vue.md)
