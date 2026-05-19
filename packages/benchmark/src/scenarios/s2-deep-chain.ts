import { atom as stanAtom, makeStore, selector } from '@rkrupinski/stan';
import {
  atom as jotaiAtom,
  createStore as createJotaiStore,
} from 'jotai/vanilla';

import type { Scenario } from '../libs/types';

const CHAIN_DEPTH = 50;

export const s2DeepChain: Scenario = {
  id: 's2',
  name: `deep selector chain (depth ${CHAIN_DEPTH})`,
  adapters: {
    stan: () => {
      const root = stanAtom(0);
      let leaf = selector(({ get }) => get(root) + 1);
      for (let n = 2; n <= CHAIN_DEPTH; n++) {
        const prev = leaf;
        leaf = selector(({ get }) => get(prev) + 1);
      }
      const store = makeStore();
      const rootState = root(store);
      const leafState = leaf(store);
      leafState.get();
      let pushed = -1;
      leafState.subscribe(v => {
        pushed = v;
      });
      let i = 0;
      return {
        tick: () => {
          rootState.set(++i);
        },
        assert: () => {
          if (pushed !== i + CHAIN_DEPTH)
            throw new Error(
              `stan s2: pushed=${pushed} expected=${i + CHAIN_DEPTH}`,
            );
          if (leafState.get() !== i + CHAIN_DEPTH)
            throw new Error('stan s2 leaf read mismatch');
        },
      };
    },
    jotai: () => {
      const store = createJotaiStore();
      const root = jotaiAtom(0);
      let leaf = jotaiAtom(get => get(root) + 1);
      for (let n = 2; n <= CHAIN_DEPTH; n++) {
        const prev = leaf;
        leaf = jotaiAtom(get => get(prev) + 1);
      }
      store.get(leaf);
      let pushed = -1;
      store.sub(leaf, () => {
        pushed = store.get(leaf);
      });
      let i = 0;
      return {
        tick: () => {
          store.set(root, ++i);
        },
        assert: () => {
          if (pushed !== i + CHAIN_DEPTH)
            throw new Error(
              `jotai s2: pushed=${pushed} expected=${i + CHAIN_DEPTH}`,
            );
          if (store.get(leaf) !== i + CHAIN_DEPTH)
            throw new Error('jotai s2 leaf read mismatch');
        },
      };
    },
  },
};
