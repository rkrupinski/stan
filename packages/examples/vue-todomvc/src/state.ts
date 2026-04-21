import { atom, selector } from "@rkrupinski/stan";

export type Todo = {
  id: string;
  title: string;
  completed: boolean;
};

export type Filter = "all" | "active" | "completed";

const STORAGE_KEY = "vue-stan-todomvc";

export const todosAtom = atom<Todo[]>([], {
  tag: "todos",
  effects: [
    ({ init, onSet }) => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          init(JSON.parse(saved) as Todo[]);
        } catch {
          // Ignore malformed storage - fall back to the default value.
        }
      }
      onSet((value) =>
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value)),
      );
    },
  ],
});

export const filterAtom = atom<Filter>("all", { tag: "filter" });

export const filteredTodos = selector(
  ({ get }) => {
    const todos = get(todosAtom);
    const filter = get(filterAtom);

    if (filter === "active") return todos.filter((todo) => !todo.completed);
    if (filter === "completed") return todos.filter((todo) => todo.completed);

    return todos;
  },
  { tag: "filtered-todos" },
);

export const activeCount = selector(
  ({ get }) => get(todosAtom).filter((todo) => !todo.completed).length,
  { tag: "active-count" },
);

export const completedCount = selector(
  ({ get }) => get(todosAtom).filter((todo) => todo.completed).length,
  { tag: "completed-count" },
);

export const hasTodos = selector(({ get }) => get(todosAtom).length > 0, {
  tag: "has-todos",
});

export const allCompleted = selector(
  ({ get }) => {
    const todos = get(todosAtom);

    return todos.length > 0 && todos.every((todo) => todo.completed);
  },
  { tag: "all-completed" },
);
