import { selector } from "@rkrupinski/stan";
import { useStanValueAsync } from "@rkrupinski/stan/react";

import { isValid } from "./utils";

const delay = <T,>(value: T) =>
  new Promise<T>((resolve) => {
    setTimeout(resolve, Math.floor(Math.random() * 1000) + 500, value);
  });

const foo = selector(() =>
  fetch("/foo.json")
    .then((res) => res.json())
    .then(delay)
);
const bar = selector(() =>
  fetch("/bar.json")
    .then((res) => res.json())
    .then(delay)
);
const baz = selector(() =>
  fetch("/baz.json")
    .then((res) => res.json())
    .then(delay)
);

const combined = selector(({ get }) =>
  Promise.all([get(foo), get(bar), get(baz)])
);

const valid = selector(async ({ get }) => {
  const raw = await get(combined);
  const ok = raw.filter(isValid);

  if (ok.length < raw.length) throw new Error("One or more failed validation");

  return ok;
});

const values = selector(async ({ get }) => {
  const items = await get(valid);

  return items.map(({ value }) => value);
});

export function Example() {
  const result = useStanValueAsync(values);

  switch (result.type) {
    case "loading":
      return <pre>Loading...</pre>;

    case "error":
      return <pre>{String(result.reason)}</pre>;

    case "ready":
      return <pre>{JSON.stringify(result.value)}</pre>;
  }
}
