import { useState, type ChangeEvent } from "react";
import { useDebounce } from "use-debounce";

import { Results } from "./Results";

import styles from "./Example.module.scss";

export function Example() {
  const [value, setValue] = useState("");
  const phrase = value.trim().toLocaleLowerCase();
  const [debouncedPhrase] = useDebounce(phrase, 300);

  return (
    <div className={styles.container}>
      <label htmlFor="search">Search Star Wars characters:</label>
      <div className={styles.inputWrapper}>
        <input
          value={value}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            setValue(e.currentTarget.value);
          }}
        />
        {!!debouncedPhrase.length && <Results phrase={debouncedPhrase} />}
      </div>
    </div>
  );
}
