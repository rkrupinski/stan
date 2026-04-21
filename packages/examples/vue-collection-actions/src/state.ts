import { selectorFamily } from "@rkrupinski/stan";

type ItemDetails = {
  result: {
    properties: {
      name: string;
    };
  };
};

export const details = selectorFamily<Promise<ItemDetails>, string>(
  (uid) =>
    async ({ signal }) => {
      const res = await fetch(`https://www.swapi.tech/api/people/${uid}`, {
        signal,
      });

      if (!res.ok) throw new Error("Nope");

      return res.json();
    },
  {
    cachePolicy: { type: "lru", maxSize: 3 },
  },
);
