import { atom, selector } from "../../../stan/src";
import { useSetStanValue, useStanValueAsync } from "../../../stan/src/react";

const req = atom(0);

const luke = selector(async ({ get, signal }) => {
  get(req);

  const res = await fetch("https://www.swapi.tech/api/people/1", { signal });

  return res.json();
});

export function Example() {
  const setReq = useSetStanValue(req);
  const result = useStanValueAsync(luke);

  return (
    <>
      <button
        onClick={() => {
          setReq((prev) => prev + 1);
        }}
      >
        Press repeatedly
      </button>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </>
  );
}
