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
        if (isMessage(message) && message.source === RELAY_SOURCE) {
          // TODO
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
