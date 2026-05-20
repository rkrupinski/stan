import { atom as stanAtom, makeStore } from '@rkrupinski/stan';
import {
  atom as jotaiAtom,
  createStore as createJotaiStore,
} from 'jotai/vanilla';
import { createStore as createZustandStore } from 'zustand/vanilla';

import type { Scenario } from '../libs/types';

export const s1Baseline: Scenario = {
  id: 's1',
  name: 'baseline: atom set + read',
  adapters: {
    stan: () => {
      const counter = stanAtom(0);
      const state = counter(makeStore());
      let i = 0;
      let sink = 0;
      return {
        tick: () => {
          state.set(++i);
          sink ^= state.get();
        },
        assert: () => {
          if (sink === Number.MIN_SAFE_INTEGER) throw new Error('sink dce');
          if (state.get() !== i) throw new Error('stan s1 assert');
        },
      };
    },
    jotai: () => {
      const store = createJotaiStore();
      const counter = jotaiAtom(0);
      let i = 0;
      let sink = 0;
      return {
        tick: () => {
          store.set(counter, ++i);
          sink ^= store.get(counter);
        },
        assert: () => {
          if (sink === Number.MIN_SAFE_INTEGER) throw new Error('sink dce');
          if (store.get(counter) !== i) throw new Error('jotai s1 assert');
        },
      };
    },
    zustand: () => {
      const store = createZustandStore<{ counter: number }>(() => ({
        counter: 0,
      }));
      let i = 0;
      let sink = 0;
      return {
        tick: () => {
          ++i;
          store.setState({ counter: i });
          sink ^= store.getState().counter;
        },
        assert: () => {
          if (sink === Number.MIN_SAFE_INTEGER) throw new Error('sink dce');
          if (store.getState().counter !== i)
            throw new Error('zustand s1 assert');
        },
      };
    },
  },
};
