import { Suspense, use } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { atom, selector } from "@rkrupinski/stan";
import { useSetStanValue, useStanValue } from "@rkrupinski/stan/react";

const req = atom(0);

const resource = selector(async ({ get, signal }) => {
  get(req);

  const res = await fetch("https://www.swapi.tech/api/people/1", { signal });

  return res.json();
});

function DataViewer() {
  const result = use(useStanValue(resource));

  return <pre>{JSON.stringify(result, null, 2)}</pre>;
}

export function Example() {
  const setReq = useSetStanValue(req);

  return (
    <>
      <button
        onClick={() => {
          setReq((prev) => prev + 1);
        }}
      >
        Refresh resource
      </button>

      <ErrorBoundary fallback={<p>Nope</p>}>
        <Suspense fallback={<p>Loading data&hellip;</p>}>
          <DataViewer />
        </Suspense>
      </ErrorBoundary>
    </>
  );
}
