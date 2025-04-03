import { atom } from "@rkrupinski/stan";

import { order, type Order } from "../types";

const isOrder = (candidate: any): candidate is Order =>
  order.includes(candidate);

export const titleAtom = atom<string>("", {
  effects: [
    ({ init, onSet }) => {
      const PARAM = "title";

      init(new URLSearchParams(window.location.search).get(PARAM) ?? "");

      onSet((value) => {
        const url = new URL(window.location.href);
        url.searchParams.set(PARAM, value);
        window.history.replaceState(null, "", url.toString());
      });
    },
  ],
});

export const orderAtom = atom<Order | null>(null, {
  effects: [
    ({ init, onSet }) => {
      const PARAM = "order";

      const currentOrder = new URLSearchParams(window.location.search).get(
        PARAM
      );

      init(isOrder(currentOrder) ? currentOrder : null);

      onSet((value) => {
        const url = new URL(window.location.href);
        if (value) url.searchParams.set(PARAM, value);
        else url.searchParams.delete(PARAM);
        window.history.replaceState(null, "", url.toString());
      });
    },
  ],
});
