import type { ReadonlyState } from './state';
import { REFRESH_TAG } from './internal';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const refresh = (state: ReadonlyState<any>) => {
  state[REFRESH_TAG]();
};
