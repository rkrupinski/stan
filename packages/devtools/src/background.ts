import { RELAY_SOURCE, isMessage, isInitMessage } from './types';

const connections = new Map<number, chrome.runtime.Port>();

chrome.runtime.onConnect.addListener(port => {
  if (port.name !== 'stan-devtools') return;

  const extensionListener = (message: unknown) => {
    if (isInitMessage(message)) {
      connections.set(message.tabId, port);
      return;
    }

    if (isMessage(message) && message.tabId) {
      chrome.tabs.sendMessage(message.tabId, message);
    }
  };

  port.onMessage.addListener(extensionListener);

  port.onDisconnect.addListener(() => {
    for (const [tabId, p] of connections) {
      if (p === port) {
        connections.delete(tabId);
        break;
      }
    }
  });
});

chrome.runtime.onMessage.addListener((request, sender) => {
  if (isMessage(request) && request.source === RELAY_SOURCE) {
    if (sender.tab?.id) {
      const port = connections.get(sender.tab.id);
      if (port) port.postMessage(request);
    }
  }
  return true;
});
