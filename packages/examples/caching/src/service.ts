export type SWCharacter = {
  properties: {
    name: string;
    url: string;
  };
};

export type SwResponse = {
  result: ReadonlyArray<SWCharacter>;
};

let ac: AbortController | undefined;

export const search = async (phrase: string) => {
  ac?.abort(new Error("Canceled"));
  ac = new AbortController();

  const res: SwResponse = await fetch(
    `https://www.swapi.tech/api/people/?name=${encodeURIComponent(phrase)}`,
    { signal: ac.signal }
  ).then((res) => res.json());

  return res.result.slice(0, 5);
};
