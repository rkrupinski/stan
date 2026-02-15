import { useEffect } from 'react';
import { useStanCallback } from '@rkrupinski/stan/react';
import { toast } from 'sonner';

import { SUPPORTED_VERSION_RANGE, MAX_LOG_ENTRIES } from '@/constants';
import { isVersionSupported } from '@/version';
import {
  PANEL_SOURCE,
  RELAY_SOURCE,
  isMessage,
  type UpdateValue,
  type RelayMessage,
} from '@/types';
import {
  registeredStoreKeys,
  storeState,
  storeLog,
  selectedStoreKey,
} from '@/state';
import type { LogEntry } from '@/state';
import { parseKey } from '@/key';

const checkVersion = isVersionSupported(SUPPORTED_VERSION_RANGE);

let logId = 0;

export const useDevtoolsBridge = () => {
  const handleMessage = useStanCallback(
    ({ set, get }) =>
      (message: RelayMessage) => {
        switch (message.type) {
          case 'RESET': {
            const keys = get(registeredStoreKeys);

            for (const key of keys) {
              set(storeState(key), []);
              set(storeLog(key), []);
            }
            set(registeredStoreKeys, []);
            set(selectedStoreKey, null);
            logId = 0;
            break;
          }

          case 'REGISTER': {
            const { key, value, libVersion } = message.data;

            if (!checkVersion(libVersion)) {
              toast.error('Unsupported Stan Version', {
                description: `This version of DevTools only supports Stan ${SUPPORTED_VERSION_RANGE}. Detected version: ${libVersion}.`,
              });
              return;
            }

            set(registeredStoreKeys, prev =>
              prev.includes(key) ? prev : [...prev, key],
            );
            set(storeState(key), value);
            break;
          }

          case 'UNREGISTER': {
            const { key } = message.data;

            set(registeredStoreKeys, prev => prev.filter(k => k !== key));
            set(storeState(key), []);
            set(storeLog(key), []);
            if (get(selectedStoreKey) === key) {
              set(selectedStoreKey, null);
            }
            break;
          }

          case 'UPDATE': {
            const { storeKey, event } = message.data;

            if (!get(registeredStoreKeys).includes(storeKey)) return;

            if (event.type === 'SET') {
              set(storeState(storeKey), prev => {
                const idx = prev.findIndex(([k]) => k === event.key);
                const entry: [string, UpdateValue] = [event.key, event.value];

                return idx >= 0
                  ? prev.map((e, i) => (i === idx ? entry : e))
                  : [...prev, entry];
              });

              const logEntry: LogEntry = {
                id: String(++logId),
                timestamp: Date.now(),
                type: 'set',
                stateKey: event.key,
                label: parseKey(event.key)?.label ?? event.key,
                value: event.value,
              };

              set(storeLog(storeKey), prev =>
                [logEntry, ...prev].slice(0, MAX_LOG_ENTRIES),
              );
            }

            if (event.type === 'DELETE') {
              set(storeState(storeKey), prev =>
                prev.filter(([k]) => k !== event.key),
              );

              const logEntry: LogEntry = {
                id: String(++logId),
                timestamp: Date.now(),
                type: 'delete',
                stateKey: event.key,
                label: parseKey(event.key)?.label ?? event.key,
              };

              set(storeLog(storeKey), prev =>
                [logEntry, ...prev].slice(0, MAX_LOG_ENTRIES),
              );
            }
            break;
          }
        }
      },
  );

  useEffect(() => {
    try {
      const port = chrome.runtime.connect({ name: 'stan-devtools' });

      port.postMessage({
        name: 'init',
        tabId: chrome.devtools.inspectedWindow.tabId,
      });

      port.postMessage({
        source: PANEL_SOURCE,
        tabId: chrome.devtools.inspectedWindow.tabId,
        type: 'REFRESH',
      });

      port.onMessage.addListener(message => {
        if (!isMessage(message) || message.source !== RELAY_SOURCE) return;
        handleMessage(message);
      });

      return () => port.disconnect();
    } catch (err) {
      console.error('Stan DevTools: Connection failed', err);
    }
  }, [handleMessage]);
};
