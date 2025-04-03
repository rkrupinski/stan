import type { Todo } from "./types";

const delay = <T>(value: T) =>
  new Promise<T>((resolve) => {
    setTimeout(resolve, Math.floor(Math.random() * 250) + 250, value);
  });

class TodoService {
  #todos: Todo[] = [
    { id: crypto.randomUUID(), title: "Grocery Shopping" },
    { id: crypto.randomUUID(), title: "Exercise" },
    { id: crypto.randomUUID(), title: "Pay Bills" },
    { id: crypto.randomUUID(), title: "Work Task" },
    { id: crypto.randomUUID(), title: "Clean Up" },
  ];

  async getTodos() {
    return Promise.resolve(this.#todos).then(delay);
  }

  async addTodo(title: string) {
    const todo: Todo = {
      id: crypto.randomUUID(),
      title,
    };

    this.#todos.push(todo);

    return Promise.resolve(todo).then(delay);
  }
}

export const todoService = new TodoService();
