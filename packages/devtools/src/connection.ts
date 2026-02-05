import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { SUPPORTED_VERSION_RANGE } from './constants';
import { isVersionSupported } from './version';
import {
  PANEL_SOURCE,
  RELAY_SOURCE,
  isMessage,
  type UpdateValue,
} from './types';

const checkVersion = isVersionSupported(SUPPORTED_VERSION_RANGE);

export const useConnection = () => {
  const portRef = useRef<chrome.runtime.Port | null>(null);
  const registeredStoreKeysRef = useRef<Set<string>>(new Set());

  const [stores, setStores] = useState<
    Record<string, Array<[string, UpdateValue]>>
  >({});

  useEffect(() => {
    try {
      const port = chrome.runtime.connect({ name: 'stan-devtools' });
      portRef.current = port;

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

        switch (message.type) {
          case 'RESET':
            console.log('==> reset devtools');
            registeredStoreKeysRef.current.clear();
            setStores({});
            break;

          case 'REGISTER': {
            const { key, value, libVersion } = message.data;
            console.log('==> register store:', key, value);

            if (!checkVersion(libVersion)) {
              toast.error('Unsupported Stan Version', {
                description: `This version of DevTools only supports Stan ${SUPPORTED_VERSION_RANGE}. Detected version: ${libVersion}.`,
              });
              return;
            }

            registeredStoreKeysRef.current.add(key);
            setStores(prev => ({ ...prev, [key]: value }));
            break;
          }

          case 'UNREGISTER':
            console.log('==> unregister store:', message.data.key);
            registeredStoreKeysRef.current.delete(message.data.key);
            setStores(prev => {
              const next = { ...prev };
              delete next[message.data.key];
              return next;
            });
            break;

          case 'UPDATE': {
            const { storeKey, event } = message.data;

            if (!registeredStoreKeysRef.current.has(storeKey)) return;

            switch (event.type) {
              case 'SET':
                console.log(`==> set ${storeKey}->${event.key}:`, event.value);
                break;

              case 'DELETE':
                console.log(`==> delete ${storeKey}->${event.key}`);
                break;
            }
          }
        }
      });

      return () => {
        port.disconnect();
      };
    } catch (err) {
      console.error('Stan DevTools: Connection failed', err);
    }
  }, []);

  return { stores };
};
