import { atomFamily as stanAtomFamily, makeStore } from '@rkrupinski/stan';
import {
  atom as jotaiAtom,
  createStore as createJotaiStore,
} from 'jotai/vanilla';
import { atomFamily as jotaiAtomFamily } from 'jotai/vanilla/utils';

import type { Scenario } from '../libs/types';

const FAMILY_SIZE = 1000;

export const s7Family: Scenario = {
  id: 's7',
  name: `atomFamily (${FAMILY_SIZE} keys) — single-key update per tick`,
  adapters: {
    stan: () => {
      const store = makeStore();
      const family = stanAtomFamily<number, number>(0);
      // pre-create all keyed instances (warm the memoize cache)
      for (let k = 0; k < FAMILY_SIZE; k++) family(k)(store);
      let i = 0;
      let sink = 0;
      return {
        tick: () => {
          const k = i % FAMILY_SIZE;
          const s = family(k)(store);
          s.set(i);
          sink ^= s.get();
          i++;
        },
        assert: () => {
          if (sink === Number.MIN_SAFE_INTEGER) throw new Error('sink dce');
          // verify the most-recently-written key has the expected value
          const lastK = (i - 1) % FAMILY_SIZE;
          if (family(lastK)(store).get() !== i - 1)
            throw new Error('stan s7 last-key mismatch');
        },
      };
    },
    jotai: () => {
      const store = createJotaiStore();
      const family = jotaiAtomFamily<
        number,
        ReturnType<typeof jotaiAtom<number>>
      >(() => jotaiAtom(0));
      for (let k = 0; k < FAMILY_SIZE; k++) family(k);
      let i = 0;
      let sink = 0;
      return {
        tick: () => {
          const k = i % FAMILY_SIZE;
          const a = family(k);
          store.set(a, i);
          sink ^= store.get(a);
          i++;
        },
        assert: () => {
          if (sink === Number.MIN_SAFE_INTEGER) throw new Error('sink dce');
          const lastK = (i - 1) % FAMILY_SIZE;
          if (store.get(family(lastK)) !== i - 1)
            throw new Error('jotai s7 last-key mismatch');
        },
      };
    },
  },
};
