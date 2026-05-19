export const LIBS = ['stan', 'jotai', 'zustand'] as const;
export type Lib = (typeof LIBS)[number];

export type Build = () => {
  tick: () => void;
  assert: () => void;
};

export interface Scenario {
  id: string;
  name: string;
  adapters: Partial<Record<Lib, Build>>;
}
