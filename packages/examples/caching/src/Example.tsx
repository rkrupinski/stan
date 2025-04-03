import { useState, type ChangeEvent } from "react";
import { useDebounce } from "use-debounce";

import styles from "./Example.module.scss";
import { Results } from "./Results";

export function Example() {
  const [value, setValue] = useState("");
  const phrase = value.trim().toLocaleLowerCase();
  const [debouncedPhrase] = useDebounce(phrase, 1);

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
