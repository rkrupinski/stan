import { useSyncExternalStore } from 'react';

const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

const subscribe = (cb: VoidFunction) => {
  darkQuery.addEventListener('change', cb);
  return () => darkQuery.removeEventListener('change', cb);
};

export type SystemTheme = 'light' | 'dark';

export const useSystemTheme = () =>
  useSyncExternalStore<SystemTheme>(subscribe, () =>
    darkQuery.matches ? 'dark' : 'light',
  );
