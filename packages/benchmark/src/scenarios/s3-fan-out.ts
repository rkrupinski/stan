import { atom as stanAtom, makeStore, selector } from '@rkrupinski/stan';
import {
  atom as jotaiAtom,
  createStore as createJotaiStore,
  type Atom,
} from 'jotai/vanilla';

import type { Scenario } from '../libs/types';

const LEAVES = 200;

export const s3FanOut: Scenario = {
  id: 's3',
  name: `wide fan-out (${LEAVES} leaves)`,
  adapters: {
    stan: () => {
      const root = stanAtom(0);
      const store = makeStore();
      const rootState = root(store);
      let pushedTotal = 0;
      for (let k = 0; k < LEAVES; k++) {
        const offset = k;
        const leaf = selector(({ get }) => get(root) + offset);
        const ls = leaf(store);
        ls.get();
        ls.subscribe(v => {
          pushedTotal += v;
        });
      }
      let i = 0;
      return {
        tick: () => {
          ++i;
          pushedTotal = 0;
          rootState.set(i);
        },
        assert: () => {
          // each leaf produces i + k, sum over k=0..LEAVES-1
          const expected = LEAVES * i + (LEAVES * (LEAVES - 1)) / 2;
          if (pushedTotal !== expected)
            throw new Error(
              `stan s3: pushed=${pushedTotal} expected=${expected}`,
            );
        },
      };
    },
    jotai: () => {
      const store = createJotaiStore();
      const root = jotaiAtom(0);
      const leaves: Atom<number>[] = [];
      for (let k = 0; k < LEAVES; k++) {
        const offset = k;
        leaves.push(jotaiAtom(get => get(root) + offset));
      }
      let pushedTotal = 0;
      for (const leaf of leaves) {
        store.get(leaf);
        store.sub(leaf, () => {
          pushedTotal += store.get(leaf);
        });
      }
      let i = 0;
      return {
        tick: () => {
          ++i;
          pushedTotal = 0;
          store.set(root, i);
        },
        assert: () => {
          const expected = LEAVES * i + (LEAVES * (LEAVES - 1)) / 2;
          if (pushedTotal !== expected)
            throw new Error(
              `jotai s3: pushed=${pushedTotal} expected=${expected}`,
            );
        },
      };
    },
  },
};
