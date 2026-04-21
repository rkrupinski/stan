import type { FC } from "react";
import { useStanValueAsync } from "@rkrupinski/stan/react";

import { filteredTodos } from "./state";

export const List: FC = () => {
  const todos = useStanValueAsync(filteredTodos);

  switch (todos.type) {
    case "loading":
      return <p>Loading&hellip;</p>;

    case "error":
      return <p>😱</p>;

    case "ready":
      return (
        <ul>
          {todos.value.map(({ id, title }) => (
            <li key={id}>{title}</li>
          ))}
        </ul>
      );
  }
};
