/// <reference types="vite/client" />

interface Window {
  __STAN_DEVTOOLS__?: {
    register(store: unknown): void;
    unregister(store: unknown): void;
    send(storeKey: string, event: unknown): void;
  };
}
