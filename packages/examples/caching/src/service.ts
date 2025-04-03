export type SWCharacter = {
  name: string;
  url: string;
};

export type SwResponse = {
  results: ReadonlyArray<SWCharacter>;
};

let ac: AbortController | undefined;

export const search = async (phrase: string) => {
  ac?.abort(new Error("Canceled"));
  ac = new AbortController();

  const res: SwResponse = await fetch(
    `https://swapi.dev/api/people/?search=${encodeURIComponent(phrase)}`,
    { signal: ac.signal }
  ).then((res) => res.json());

  return res.results.slice(0, 5);
};
