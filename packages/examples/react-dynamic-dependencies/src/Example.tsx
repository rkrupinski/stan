import { atom, selector } from "@rkrupinski/stan";
import { useStan, useStanValue, useSetStanValue } from "@rkrupinski/stan/react";

const dep1 = atom(0);

const dep2 = atom("hello");

const toggle = atom(false);

const result = selector(({ get }) => {
  console.log("result evaluated");

  if (get(toggle)) return get(dep1);

  return get(dep2);
});

export function Example() {
  const setT = useSetStanValue(toggle);
  const [d1, setD1] = useStan(dep1);
  const [d2, setD2] = useStan(dep2);
  const value = useStanValue(result);

  return (
    <>
      <label htmlFor="d1">dep1:</label>{" "}
      <input
        id="d1"
        name="d1"
        type="number"
        value={d1}
        onChange={(e) => {
          setD1(e.target.valueAsNumber);
        }}
      />
      <br />
      <label htmlFor="d2">dep2:</label>{" "}
      <input
        id="d2"
        name="d2"
        type="text"
        value={d2}
        onChange={(e) => {
          setD2(e.target.value);
        }}
      />
      <hr />
      <button
        onClick={() => {
          setT((prev) => !prev);
        }}
      >
        Toggle dep
      </button>
      <pre>result: {JSON.stringify(value)}</pre>
    </>
  );
}
