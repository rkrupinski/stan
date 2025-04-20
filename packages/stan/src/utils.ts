import type { ReadonlyState, WritableState } from './state';
import { REFRESH_TAG, RESET_TAG } from './internal';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const refresh = (state: ReadonlyState<any>) => {
  state[REFRESH_TAG]();
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const reset = (state: WritableState<any>) => {
  state[RESET_TAG]();
};
