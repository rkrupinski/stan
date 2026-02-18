import { selectorFamily } from "@rkrupinski/stan";

type SWCharacter = {
  properties: {
    name: string;
    url: string;
  };
};

type SwResponse = {
  result: ReadonlyArray<SWCharacter>;
};

export const swSearch = selectorFamily<Promise<SwResponse>, string>(
  (phrase) =>
    async ({ signal }) => {
      const res = await fetch(
        `https://www.swapi.tech/api/people/?name=${encodeURIComponent(phrase)}`,
        { signal }
      );

      if (!res.ok) throw new Error(res.statusText);

      return res.json();
    },
  {
    cachePolicy: { type: "lru", maxSize: 130 },
  }
);
