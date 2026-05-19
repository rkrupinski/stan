import { atom as stanAtom, makeStore, selector } from '@rkrupinski/stan';
import { atom as jotaiAtom, createStore as createJotaiStore } from 'jotai/vanilla';

import type { Scenario } from '../libs/types';

export const s4Diamond: Scenario = {
  id: 's4',
  name: 'diamond (shared dep coalescing)',
  adapters: {
    stan: () => {
      let leafEvals = 0;
      const root = stanAtom(0);
      const left = selector(({ get }) => get(root) * 2);
      const right = selector(({ get }) => get(root) + 1);
      const leaf = selector(({ get }) => {
        leafEvals++;
        return get(left) + get(right);
      });
      const store = makeStore();
      const rootState = root(store);
      const leafState = leaf(store);
      leafState.get();
      let pushed = -1;
      leafState.subscribe(v => {
        pushed = v;
      });
      let i = 0;
      let lastEvalCount = leafEvals;
      return {
        tick: () => {
          ++i;
          lastEvalCount = leafEvals;
          rootState.set(i);
        },
        assert: () => {
          const expected = i * 2 + i + 1;
          if (pushed !== expected)
            throw new Error(`stan s4: pushed=${pushed} expected=${expected}`);
          // leaf must coalesce: at most one re-eval per root set
          if (leafEvals - lastEvalCount > 1)
            throw new Error(
              `stan s4 diamond: leaf re-evaluated ${leafEvals - lastEvalCount} times`,
            );
        },
      };
    },
    jotai: () => {
      let leafEvals = 0;
      const store = createJotaiStore();
      const root = jotaiAtom(0);
      const left = jotaiAtom(get => get(root) * 2);
      const right = jotaiAtom(get => get(root) + 1);
      const leaf = jotaiAtom(get => {
        leafEvals++;
        return get(left) + get(right);
      });
      store.get(leaf);
      let pushed = -1;
      store.sub(leaf, () => {
        pushed = store.get(leaf);
      });
      let i = 0;
      let lastEvalCount = leafEvals;
      return {
        tick: () => {
          ++i;
          lastEvalCount = leafEvals;
          store.set(root, i);
        },
        assert: () => {
          const expected = i * 2 + i + 1;
          if (pushed !== expected)
            throw new Error(`jotai s4: pushed=${pushed} expected=${expected}`);
          if (leafEvals - lastEvalCount > 1)
            throw new Error(
              `jotai s4 diamond: leaf re-evaluated ${leafEvals - lastEvalCount} times`,
            );
        },
      };
    },
  },
};
