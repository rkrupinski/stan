import { type FC } from "react";
import { useStanRefresh, useStanValueAsync } from "@rkrupinski/stan/react";

import { swSearch } from "./state";

import styles from "./Results.module.scss";

export type ResultsProps = {
  phrase: string;
};

export const Results: FC<ResultsProps> = ({ phrase }) => {
  const data = useStanValueAsync(swSearch(phrase));
  const refresh = useStanRefresh(swSearch(phrase));

  return (
    <div className={styles.resultsContainer}>
      {data.type === "loading" && (
        <p className={styles.text}>Loading&hellip;</p>
      )}
      {data.type === "error" && (
        <>
          <p className={styles.text}>Nope: {data.reason}</p>
          <button onClick={refresh}>Try again</button>
        </>
      )}
      {data.type === "ready" && (
        <>
          {data.value.result.length ? (
            <ul className={styles.results}>
              {data.value.result
                .slice(0, 5)
                .map(({ properties: { name, url } }) => (
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
