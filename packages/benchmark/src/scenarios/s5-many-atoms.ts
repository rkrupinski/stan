import { atom as stanAtom, makeStore } from '@rkrupinski/stan';
import type { WritableState } from '@rkrupinski/stan';
import {
  atom as jotaiAtom,
  createStore as createJotaiStore,
  type PrimitiveAtom,
} from 'jotai/vanilla';
import { createStore as createZustandStore } from 'zustand/vanilla';

import type { Scenario } from '../libs/types';

const ATOMS = 100;

export const s5ManyAtoms: Scenario = {
  id: 's5',
  name: `${ATOMS} independent atoms, sequential writes per tick`,
  adapters: {
    stan: () => {
      const store = makeStore();
      const states: WritableState<number>[] = [];
      for (let k = 0; k < ATOMS; k++) states.push(stanAtom(0)(store));
      let i = 0;
      let sink = 0;
      return {
        tick: () => {
          ++i;
          for (let k = 0; k < ATOMS; k++) {
            states[k].set(i);
            sink ^= states[k].get();
          }
        },
        assert: () => {
          if (sink === Number.MIN_SAFE_INTEGER) throw new Error('sink dce');
          for (const s of states) {
            if (s.get() !== i) throw new Error('stan s5 mismatch');
          }
        },
      };
    },
    jotai: () => {
      const store = createJotaiStore();
      const atoms: PrimitiveAtom<number>[] = [];
      for (let k = 0; k < ATOMS; k++) atoms.push(jotaiAtom(0));
      let i = 0;
      let sink = 0;
      return {
        tick: () => {
          ++i;
          for (let k = 0; k < ATOMS; k++) {
            store.set(atoms[k], i);
            sink ^= store.get(atoms[k]);
          }
        },
        assert: () => {
          if (sink === Number.MIN_SAFE_INTEGER) throw new Error('sink dce');
          for (const a of atoms) {
            if (store.get(a) !== i) throw new Error('jotai s5 mismatch');
          }
        },
      };
    },
    zustand: () => {
      type Shape = Record<string, number>;
      const initial: Shape = {};
      for (let k = 0; k < ATOMS; k++) initial[`k${k}`] = 0;
      const store = createZustandStore<Shape>(() => initial);
      let i = 0;
      let sink = 0;
      return {
        tick: () => {
          ++i;
          for (let k = 0; k < ATOMS; k++) {
            store.setState({ [`k${k}`]: i });
            sink ^= store.getState()[`k${k}`];
          }
        },
        assert: () => {
          if (sink === Number.MIN_SAFE_INTEGER) throw new Error('sink dce');
          const state = store.getState();
          for (let k = 0; k < ATOMS; k++) {
            if (state[`k${k}`] !== i) throw new Error('zustand s5 mismatch');
          }
        },
      };
    },
  },
};
