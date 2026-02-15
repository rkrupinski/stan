import {
  AGENT_SOURCE,
  RELAY_SOURCE,
  PANEL_SOURCE,
  RELAY_INBOUND_SOURCE,
  isMessage,
  type RelayMessage,
  type RelayInboundMessage,
} from '@/types';

window.addEventListener('message', event => {
  if (event.source !== window || !event.data) {
    return;
  }

  const data = event.data;

  if (!isMessage(data) || data.source !== AGENT_SOURCE) {
    return;
  }

  const message: RelayMessage = {
    ...data,
    source: RELAY_SOURCE,
  };

  chrome.runtime.sendMessage(message);
});

chrome.runtime.onMessage.addListener(request => {
  if (!isMessage(request) || request.source !== PANEL_SOURCE) {
    return;
  }

  const message: RelayInboundMessage = {
    ...request,
    source: RELAY_INBOUND_SOURCE,
  };

  window.postMessage(message, '*');
});
