import { selector } from "@rkrupinski/stan";
import { useStanRefresh, useStanValueAsync } from "@rkrupinski/stan/react";

const foo = ((attempts: number) => {
  let i = 0;

  return selector(async () => {
    console.log("foo evaluated");

    if (++i < attempts) {
      throw new Error("Nope");
    }

    return i;
  });
})(2);

const bar = selector(async () => {
  console.log("bar evaluated");

  return Math.random();
});

const baz = selector(async ({ get }) => {
  console.log("baz evaluated");
  const result = await Promise.allSettled([get(foo), get(bar)]);

  return result;
});

export function Example() {
  const result = useStanValueAsync(baz);
  const refresh = useStanRefresh(baz);

  return (
    <>
      <pre>
        {JSON.stringify(
          result,
          (_, value) => (value instanceof Error ? value.message : value),
          2
        )}
      </pre>
      <button onClick={refresh}>Again</button>
    </>
  );
}
