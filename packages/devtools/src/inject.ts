import { sanitize } from './sanitize';
import {
  AGENT_SOURCE,
  RELAY_INBOUND_SOURCE,
  MessageType,
  MessagePayloads,
  StoreUpdateEvent,
  AgentMessage,
  isMessage,
} from './types';

interface Store {
  key: string;
  value: Map<string, unknown>;
}

const stores = new Map<string, Store>();

const send = <T extends MessageType>(type: T, data?: MessagePayloads[T]) => {
  try {
    const message: AgentMessage<T> = {
      source: AGENT_SOURCE,
      type,
      data,
    };
    window.postMessage(message, '*');
  } catch (e) {
    console.error('Stan DevTools: Failed to send message', e);
  }
};

send('RESET');

window.__STAN_DEVTOOLS__ = {
  register(store: Store) {
    stores.set(store.key, store);
    send('REGISTER', {
      key: store.key,
      value: sanitize(store.value),
    });
  },
  unregister(store: Store) {
    stores.delete(store.key);
    send('UNREGISTER', { key: store.key });
  },
  send(storeKey: string, event: StoreUpdateEvent) {
    send('UPDATE', {
      storeKey,
      event: {
        ...event,
        value: event.type === 'SET' ? sanitize(event.value) : undefined,
      },
    });
  },
};

window.addEventListener('message', event => {
  const data = event.data;
  if (
    !isMessage(data) ||
    data.source !== RELAY_INBOUND_SOURCE ||
    data.type !== 'REFRESH'
  ) {
    return;
  }

  send('RESET');
  for (const store of stores.values()) {
    send('REGISTER', {
      key: store.key,
      value: sanitize(store.value),
    });
  }
});
