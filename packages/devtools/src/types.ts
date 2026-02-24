export const AGENT_SOURCE = 'stan-devtools-agent';
export const RELAY_SOURCE = 'stan-devtools-relay';
export const PANEL_SOURCE = 'stan-devtools-panel';
export const RELAY_INBOUND_SOURCE = 'stan-devtools-relay-inbound';

export type Source =
  | typeof AGENT_SOURCE
  | typeof RELAY_SOURCE
  | typeof PANEL_SOURCE
  | typeof RELAY_INBOUND_SOURCE;

export type UpdateValue =
  | { type: 'sync'; value: unknown }
  | { type: 'async-pending' }
  | { type: 'async-resolved'; value: unknown }
  | { type: 'async-rejected'; value: unknown };

export type RenderValue =
  | { type: 'ready'; value: unknown }
  | { type: 'pending' };

export type StoreUpdateEvent =
  | { type: 'SET'; key: string; value: UpdateValue }
  | { type: 'DELETE'; key: string };

export interface RegisterPayload {
  key: string;
  libVersion: string;
  value: Array<[string, UpdateValue]>;
}

export interface UnregisterPayload {
  key: string;
}

export interface UpdatePayload {
  storeKey: string;
  event: StoreUpdateEvent;
}

export type MessagePayloads = {
  RESET: undefined;
  REGISTER: RegisterPayload;
  UNREGISTER: UnregisterPayload;
  UPDATE: UpdatePayload;
  REFRESH: undefined;
};

export type MessageType = keyof MessagePayloads;

type MessageData<T extends MessageType> = MessagePayloads[T] extends undefined
  ? { data?: undefined }
  : { data: MessagePayloads[T] };

type DistributiveMessage<
  S extends Source,
  T extends MessageType,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
> = T extends any
  ? { source: S; type: T; tabId?: number } & MessageData<T>
  : never;

export type AgentMessage<T extends MessageType = MessageType> =
  DistributiveMessage<typeof AGENT_SOURCE, T>;

export type RelayMessage<T extends MessageType = MessageType> =
  DistributiveMessage<typeof RELAY_SOURCE, T>;

export type PanelMessage<T extends MessageType = MessageType> =
  DistributiveMessage<typeof PANEL_SOURCE, T>;

export type RelayInboundMessage<T extends MessageType = MessageType> =
  DistributiveMessage<typeof RELAY_INBOUND_SOURCE, T>;

export type Message =
  | AgentMessage
  | RelayMessage
  | PanelMessage
  | RelayInboundMessage;

export interface InitMessage {
  name: 'init';
  tabId: number;
}

export const isMessage = (msg: unknown): msg is Message => {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'source' in msg &&
    typeof (msg as Record<string, unknown>).source === 'string' &&
    [AGENT_SOURCE, RELAY_SOURCE, PANEL_SOURCE, RELAY_INBOUND_SOURCE].includes(
      (msg as Record<string, unknown>).source as string,
    ) &&
    'type' in msg
  );
};

export const isInitMessage = (msg: unknown): msg is InitMessage => {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'name' in msg &&
    (msg as Record<string, unknown>).name === 'init' &&
    'tabId' in msg &&
    typeof (msg as Record<string, unknown>).tabId === 'number'
  );
};
