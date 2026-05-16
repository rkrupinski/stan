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
  entries(): IterableIterator<[string, unknown]>;
  versionOf(key: string): number;
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
  let currentVersion: number;

  try {
    currentVersion = store.versionOf(key);
  } catch (err) {
    console.error('Stan DevTools: trackAsyncState init failed', err);
    return;
  }

  promise
    .then((res: unknown) => {
      try {
        if (!stores.has(store.key)) return;
        if (store.versionOf(key) !== currentVersion) return;

        send('UPDATE', {
          storeKey: store.key,
          event: {
            type: 'SET',
            key,
            value: { type: 'async-resolved', value: sanitize(res) },
          },
        });
      } catch (err) {
        console.error('Stan DevTools: trackAsyncState resolve failed', err);
      }
    })
    .catch((err: unknown) => {
      try {
        if (!stores.has(store.key)) return;
        if (store.versionOf(key) !== currentVersion) return;

        send('UPDATE', {
          storeKey: store.key,
          event: {
            type: 'SET',
            key,
            value: { type: 'async-rejected', value: sanitize(err) },
          },
        });
      } catch (innerErr) {
        console.error('Stan DevTools: trackAsyncState reject failed', innerErr);
      }
    });
};

window.__STAN_DEVTOOLS__ = {
  register(store: Store) {
    try {
      stores.set(store.key, store);

      let value: MessagePayloads['REGISTER']['value'] = [];

      try {
        value = Array.from(store.entries()).map(([k, v]) => {
          if (v instanceof Promise) {
            trackAsyncState(store, k, v);
            return [k, { type: 'async-pending' }];
          }

          return [k, { type: 'sync', value: sanitize(v) }];
        });
      } catch (snapshotErr) {
        console.error(
          'Stan DevTools: store snapshot failed (incompatible Stan version?)',
          snapshotErr,
        );
      }

      send('REGISTER', {
        key: store.key,
        libVersion: store.libVersion,
        value,
      });
    } catch (err) {
      console.error('Stan DevTools: register failed', err);
    }
  },
  unregister(store: Store) {
    try {
      stores.delete(store.key);
      send('UNREGISTER', { key: store.key });
    } catch (err) {
      console.error('Stan DevTools: unregister failed', err);
    }
  },
  send(storeKey: string, event: StanStoreEvent) {
    try {
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
    } catch (err) {
      console.error('Stan DevTools: send failed', err);
    }
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

  try {
    send('RESET');

    for (const store of stores.values()) {
      window.__STAN_DEVTOOLS__?.register(store);
    }
  } catch (err) {
    console.error('Stan DevTools: refresh failed', err);
  }
});
