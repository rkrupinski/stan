import type { FC } from "react";
import { useStanValueAsync } from "@rkrupinski/stan/react";

import { swSearch } from "./state";

import styles from "./Results.module.scss";

export type ResultsProps = {
  phrase: string;
};

export const Results: FC<ResultsProps> = ({ phrase }) => {
  const results = useStanValueAsync(swSearch(phrase));

  return (
    <div className={styles.resultsContainer}>
      {results.type === "loading" && (
        <p className={styles.text}>Loading&hellip;</p>
      )}
      {results.type === "error" && (
        <p className={styles.text}>
          {results.reason === "Canceled" ? (
            <>&nbsp;</>
          ) : (
            `Error: ${results.reason}`
          )}
        </p>
      )}
      {results.type === "ready" && (
        <>
          {results.value.length ? (
            <ul className={styles.results}>
              {results.value.map(({ name, url }) => (
                <li key={url} className={styles.result}>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    {name}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.text}>No results</p>
          )}
        </>
      )}
    </div>
  );
};
