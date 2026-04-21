import { selector } from "@rkrupinski/stan";

import type { Order, Todo } from "../types";
import { orderAtom, titleAtom } from "../Filters/state";
import { todoService } from "../service";

const predicate = (order: Order | null) => {
  switch (order) {
    case "asc":
      return (a: Todo, b: Todo) => a.title.localeCompare(b.title);
    case "desc":
      return (a: Todo, b: Todo) => b.title.localeCompare(a.title);
    default:
      return () => 0;
  }
};

export const allTodos = selector(() => todoService.getTodos(), {
  tag: "All todos",
});

export const filteredTodos = selector(
  async ({ get }) => {
    const todos = await get(allTodos);
    const title = get(titleAtom).trim().toLocaleLowerCase();
    const order = get(orderAtom);

    return todos
      .filter((todo) => todo.title.toLowerCase().includes(title))
      .sort(predicate(order));
  },
  { tag: "Filtered todos" }
);
