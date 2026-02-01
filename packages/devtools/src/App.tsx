import { useEffect, useRef } from 'react';
import { PANEL_SOURCE, RELAY_SOURCE, isMessage } from './types';

export const App = () => {
  const portRef = useRef<chrome.runtime.Port | null>(null);

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
            break;

          case 'REGISTER':
            console.log(
              '==> register store:',
              message.data.key,
              message.data.value,
            );
            break;

          case 'UNREGISTER':
            console.log('==> unregister store:', message.data.key);
            break;

          case 'UPDATE': {
            switch (message.data.event.type) {
              case 'SET':
                console.log(
                  `==> set ${message.data.storeKey}->${message.data.event.key}:`,
                  message.data.event.value,
                );
                break;

              case 'DELETE':
                console.log(
                  `==> delete ${message.data.storeKey}->${message.data.event.key}`,
                );
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

  return <h1>Stan</h1>;
};
