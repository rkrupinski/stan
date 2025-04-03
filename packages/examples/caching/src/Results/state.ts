import { selectorFamily } from "@rkrupinski/stan";

import { search, type SWCharacter } from "../service";

export const swSearch = selectorFamily<Promise<SWCharacter[]>, string>(
  (phrase) => () => search(phrase),
  {
    cachePolicy: { type: "lru", maxSize: 5 },
  }
);
