import { useState } from "react";
import { atom, makeStore } from "@rkrupinski/stan";
import { StanProvider, useStan } from "@rkrupinski/stan/react";
import { useStanReset } from "@rkrupinski/stan/react";

const myAtom = atom("");

function StateTest() {
  const [value, setValue] = useStan(myAtom);
  const r = useStanReset(myAtom);

  return (
    <>
      <input
        placeholder="Enter text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />{" "}
      <button onClick={() => r()}>Reset</button>
    </>
  );
}

const stores = [makeStore(), makeStore(), makeStore()];

export function Example() {
  const [storeIndex, setStoreIndex] = useState(0);

  return (
    <StanProvider store={stores[storeIndex]}>
      <button
        onClick={() => {
          setStoreIndex((prev) => (prev + 1) % stores.length);
        }}
      >
        Next store
      </button>
      <p>
        Active store:{" "}
        {stores.map((_, i) => (
          <span
            key={i}
            style={
              i === storeIndex ? { border: "1px dotted black" } : undefined
            }
          >
            {i + 1}
          </span>
        ))}
      </p>
      <StateTest />
    </StanProvider>
  );
}
