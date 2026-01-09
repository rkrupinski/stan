import { atom, type AtomEffect } from "@rkrupinski/stan";
import { useStan } from "@rkrupinski/stan/react";

const STORAGE_KEY = "@@@";

const storageEffect: AtomEffect<string> = ({ init, onSet }) => {
  let currentValue = localStorage.getItem(STORAGE_KEY);

  if (!currentValue) {
    currentValue = `${Math.random()}`;
    localStorage.setItem(STORAGE_KEY, currentValue);
  }

  init(currentValue);

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
      <pre>Value: {value}</pre>
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
