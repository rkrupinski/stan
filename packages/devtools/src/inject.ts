import { sanitize } from './sanitize';
import {
  AGENT_SOURCE,
  RELAY_INBOUND_SOURCE,
  type MessageType,
  type MessagePayloads,
  type AgentMessage,
  isMessage,
} from './types';

interface Store {
  key: string;
  libVersion: string;
  value: Map<string, unknown>;
  version: Map<string, number>;
}

const stores = new Map<string, Store>();

const send = <T extends MessageType>(type: T, data?: MessagePayloads[T]) => {
  try {
    const message = {
      source: AGENT_SOURCE,
      type,
      data,
    } as AgentMessage<T>;
    window.postMessage(message, '*');
  } catch (e) {
    console.error('Stan DevTools: Failed to send message', e);
  }
};

send('RESET');

type StanStoreEvent =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { type: 'SET'; key: string; value: any } | { type: 'DELETE'; key: string };

const trackAsyncState = (
  store: Store,
  key: string,
  promise: Promise<unknown>,
) => {
  const currentVersion = store.version.get(key);

  promise
    .then((res: unknown) => {
      if (!stores.has(store.key)) return;
      if (store.version.get(key) !== currentVersion) return;

      send('UPDATE', {
        storeKey: store.key,
        event: {
          type: 'SET',
          key,
          value: { type: 'async-resolved', value: sanitize(res) },
        },
      });
    })
    .catch((err: unknown) => {
      if (!stores.has(store.key)) return;
      if (store.version.get(key) !== currentVersion) return;

      send('UPDATE', {
        storeKey: store.key,
        event: {
          type: 'SET',
          key,
          value: { type: 'async-rejected', value: sanitize(err) },
        },
      });
    });
};

window.__STAN_DEVTOOLS__ = {
  register(store: Store) {
    stores.set(store.key, store);
    send('REGISTER', {
      key: store.key,
      libVersion: store.libVersion,
      value: Array.from(store.value.entries()).map(([k, v]) => {
        if (v instanceof Promise) {
          trackAsyncState(store, k, v);
          return [k, { type: 'async-pending' }];
        }

        return [k, { type: 'sync', value: sanitize(v) }];
      }),
    });
  },
  unregister(store: Store) {
    stores.delete(store.key);
    send('UNREGISTER', { key: store.key });
  },
  send(storeKey: string, event: StanStoreEvent) {
    if (event.type === 'DELETE') {
      send('UPDATE', {
        storeKey,
        event: { type: 'DELETE', key: event.key },
      });
      return;
    }

    const store = stores.get(storeKey);

    if (!store) return;

    const { value } = event;

    if (value instanceof Promise) {
      send('UPDATE', {
        storeKey,
        event: {
          type: 'SET',
          key: event.key,
          value: { type: 'async-pending' },
        },
      });

      trackAsyncState(store, event.key, value);
      return;
    }

    send('UPDATE', {
      storeKey,
      event: {
        type: 'SET',
        key: event.key,
        value: { type: 'sync', value: sanitize(value) },
      },
    });
  },
};

window.addEventListener('message', event => {
  const { data } = event;

  if (
    !isMessage(data) ||
    data.source !== RELAY_INBOUND_SOURCE ||
    data.type !== 'REFRESH'
  ) {
    return;
  }

  send('RESET');

  for (const store of stores.values()) {
    window.__STAN_DEVTOOLS__?.register(store);
  }
});
