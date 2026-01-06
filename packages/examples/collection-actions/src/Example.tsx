import { selectorFamily } from "@rkrupinski/stan";
import {
  useStanCallback,
  useStanCtx,
  useStanValueAsync,
} from "@rkrupinski/stan/react";
import { FC } from "react";

type ItemDetails = {
  result: {
    properties: {
      name: string;
    };
  };
};

const details = selectorFamily<Promise<ItemDetails>, string>(
  (uid: string) =>
    async ({ signal }) => {
      const res = await fetch(`https://www.swapi.tech/api/people/${uid}`, {
        signal,
      });

      if (!res.ok) throw new Error("Nope");

      return res.json();
    },
  {
    cachePolicy: {
      type: "lru",
      maxSize: 4,
    },
  }
);

const UIDS = Array.from({ length: 5 }, (_, i) => `${i + 1}`);

const Details: FC<{ uid: string }> = ({ uid }) => {
  const data = useStanValueAsync(details(uid));

  if (data.type === "loading") return "Loading…";

  if (data.type === "error") return String(data.reason);

  return data.value.result.properties.name;
};

export function Example() {
  const { store } = useStanCtx();

  (window as any).__STORE__ = store;

  const refreshItem = useStanCallback(({ refresh }) => (uid: string) => {
    refresh(details(uid));
  });

  return (
    <table
      style={{ tableLayout: "fixed", borderCollapse: "collapse" }}
      border={1}
    >
      <thead>
        <tr>
          <th style={{ width: 200, textAlign: "left" }}>Name</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {UIDS.map((uid) => (
          <tr key={uid}>
            <td>
              <Details uid={uid} />
            </td>
            <td>
              <button
                onClick={() => {
                  refreshItem(uid);
                }}
              >
                Refresh
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
