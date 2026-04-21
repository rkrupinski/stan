import { useCallback, useState, type FC } from "react";
import { useStanRefresh } from "@rkrupinski/stan/react";

import { allTodos } from "../List/state";
import { todoService } from "../service";

export const Toolbar: FC = () => {
  const refreshTodos = useStanRefresh(allTodos);
  const [busy, setBusy] = useState(false);

  const onAddTodo = useCallback(async () => {
    const title = (prompt("Todo title:") ?? "").trim();

    if (!title) return;

    setBusy(true);

    try {
      await todoService.addTodo(title);

      refreshTodos();
    } catch {
      // 😱
    } finally {
      setBusy(false);
    }
  }, [refreshTodos]);

  return (
    <button type="button" disabled={busy} onClick={onAddTodo}>
      Add todo
    </button>
  );
};
