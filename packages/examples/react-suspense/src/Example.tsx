import { Suspense, use, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { selector } from "@rkrupinski/stan";
import { useStanRefresh, useStanValue } from "@rkrupinski/stan/react";

const resource = selector(async ({ signal }) => {
  const res = await fetch("https://www.swapi.tech/api/people/1", { signal });

  if (!res.ok) throw new Error("Nope");

  return res.json();
});

function DataViewer() {
  const value = use(useStanValue(resource));

  return <pre>{JSON.stringify(value, null, 2)}</pre>;
}

export function Example() {
  const [attempt, setAttempt] = useState(0);
  const refresh = useStanRefresh(resource);

  return (
    <ErrorBoundary
      key={attempt}
      fallback={
        <>
          <p>Nope</p>
          <button
            onClick={() => {
              refresh();
              setAttempt((prev) => prev + 1);
            }}
          >
            Retry
          </button>
        </>
      }
    >
      <Suspense fallback={<p>Loading&hellip;</p>}>
        <DataViewer />
      </Suspense>
    </ErrorBoundary>
  );
}
