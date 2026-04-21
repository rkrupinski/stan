<script setup lang="ts">
import { useStanValue, useStanCallback } from "@rkrupinski/stan/vue";

import { todosAtom, filteredTodos, hasTodos, allCompleted } from "./state";
import TodoItem from "./TodoItem.vue";

const any = useStanValue(hasTodos);
const visible = useStanValue(filteredTodos);
const everyDone = useStanValue(allCompleted);

const toggleAll = useStanCallback(({ set }) => (completed: boolean) => {
  set(todosAtom, (prev) => prev.map((todo) => ({ ...todo, completed })));
});

function onToggleAll(event: Event) {
  toggleAll((event.target as HTMLInputElement).checked);
}
</script>

<template>
  <section v-show="any" class="main">
    <input
      id="toggle-all"
      class="toggle-all"
      type="checkbox"
      :checked="everyDone"
      @change="onToggleAll"
    />
    <label for="toggle-all">Mark all as complete</label>
    <ul class="todo-list">
      <TodoItem v-for="todo in visible" :key="todo.id" :todo="todo" />
    </ul>
  </section>
</template>
