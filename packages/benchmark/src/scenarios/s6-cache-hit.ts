import { atom as stanAtom, makeStore, selector } from '@rkrupinski/stan';
import {
  atom as jotaiAtom,
  createStore as createJotaiStore,
} from 'jotai/vanilla';
import { createStore as createZustandStore } from 'zustand/vanilla';

import type { Scenario } from '../libs/types';

export const s6CacheHit: Scenario = {
  id: 's6',
  name: 'derived read (cache hit, deps unchanged)',
  adapters: {
    stan: () => {
      const root = stanAtom(7);
      const derived = selector(({ get }) => get(root) * 2 + 1);
      const store = makeStore();
      const derivedState = derived(store);
      derivedState.get(); // prime cache
      let sink = 0;
      return {
        tick: () => {
          sink ^= derivedState.get();
        },
        assert: () => {
          if (sink === Number.MIN_SAFE_INTEGER) throw new Error('sink dce');
          if (derivedState.get() !== 15)
            throw new Error('stan s6 derived read mismatch');
        },
      };
    },
    jotai: () => {
      const store = createJotaiStore();
      const root = jotaiAtom(7);
      const derived = jotaiAtom(get => get(root) * 2 + 1);
      store.get(derived);
      let sink = 0;
      return {
        tick: () => {
          sink ^= store.get(derived);
        },
        assert: () => {
          if (sink === Number.MIN_SAFE_INTEGER) throw new Error('sink dce');
          if (store.get(derived) !== 15)
            throw new Error('jotai s6 derived read mismatch');
        },
      };
    },
    zustand: () => {
      const store = createZustandStore<{ root: number }>(() => ({ root: 7 }));
      const select = (s: { root: number }) => s.root * 2 + 1;
      let sink = 0;
      return {
        tick: () => {
          sink ^= select(store.getState());
        },
        assert: () => {
          if (sink === Number.MIN_SAFE_INTEGER) throw new Error('sink dce');
          if (select(store.getState()) !== 15)
            throw new Error('zustand s6 select mismatch');
        },
      };
    },
  },
};
