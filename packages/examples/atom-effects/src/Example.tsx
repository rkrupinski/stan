import { atom, type AtomEffect } from "@rkrupinski/stan";
import { useStan } from "@rkrupinski/stan/react";

const STORAGE_KEY = "@@@";

const storageEffect: AtomEffect<string> = ({ init, onSet }) => {
  init(localStorage.getItem(STORAGE_KEY) ?? `${Math.random()}`);

  onSet((newValue) => {
    localStorage.setItem(STORAGE_KEY, newValue);
  });
};

const myAtom = atom("", {
  effects: [storageEffect],
});

export function Example() {
  const [value, setValue] = useStan(myAtom);

  return (
    <>
      <pre>value: {JSON.stringify(value)}</pre>
      <button
        onClick={() => {
          setValue(`${Math.random()}`);
        }}
      >
        Randomize
      </button>
    </>
  );
}
