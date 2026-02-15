import { atom, atomFamily, selector, selectorFamily } from '@rkrupinski/stan';

import type { UpdateValue } from '@/types';
import { parseKey } from '@/key';
import { type NormalizedString, normalizeString } from '@/normalize';

export type ViewMode = 'explore' | 'log';

export type LogEntry = {
  id: string;
  timestamp: number;
} & (
  | { type: 'set'; stateKey: string; label: string; value: UpdateValue }
  | { type: 'delete'; stateKey: string; label: string }
);

export type StoreListItem = {
  key: string;
  label: string;
};

export type ParsedStateEntry = {
  key: string;
  label: string;
  value: UpdateValue;
};

export const storeState = atomFamily<Array<[string, UpdateValue]>, string>([]);

export const storeLog = atomFamily<LogEntry[], string>([]);

export const registeredStoreKeys = atom<string[]>([]);

export const selectedStoreKey = atom<string | null>(null);

export const viewMode = atom<ViewMode>('explore');

export const selectedStateKey = atom<string | null>(null);

export const effectiveSelectedStoreKey = selector<string | null>(({ get }) => {
  const selected = get(selectedStoreKey);
  if (!selected) return null;
  const keys = get(registeredStoreKeys);
  return keys.includes(selected) ? selected : null;
});

export const storeList = selector<StoreListItem[]>(({ get }) =>
  get(registeredStoreKeys).map(key => ({
    key,
    label: parseKey(key)?.label ?? key,
  })),
);

export const storeEntries = selectorFamily<ParsedStateEntry[], string>(
  (storeKey: string) =>
    ({ get }) =>
      get(storeState(storeKey)).map(([key, value]) => ({
        key,
        label: parseKey(key)?.label ?? key,
        value,
      })),
);

export const filteredStoreLog = selectorFamily<
  LogEntry[],
  { storeKey: string; query: NormalizedString }
>(
  ({ storeKey, query }) =>
    ({ get }) => {
      const log = get(storeLog(storeKey));
      if (!query) return log;
      return log.filter(entry => normalizeString(entry.label).includes(query));
    },
  {
    cachePolicy: { type: 'most-recent' },
  },
);

export const effectiveSelectedStateKey = selector<string | null>(({ get }) => {
  const storeKey = get(effectiveSelectedStoreKey);
  const stateKey = get(selectedStateKey);
  if (!storeKey || !stateKey) return null;
  const entries = get(storeState(storeKey));
  return entries.some(([k]) => k === stateKey) ? stateKey : null;
});
