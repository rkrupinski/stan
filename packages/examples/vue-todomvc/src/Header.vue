<script setup lang="ts">
import { ref } from "vue";
import { useStanCallback } from "@rkrupinski/stan/vue";

import { todosAtom, type Todo } from "./state";

const title = ref("");

const addTodo = useStanCallback(({ set }) => (value: string) => {
  const next: Todo = {
    id: crypto.randomUUID(),
    title: value,
    completed: false,
  };

  set(todosAtom, (prev) => [...prev, next]);
});

function submit() {
  const trimmed = title.value.trim();

  if (!trimmed) return;

  addTodo(trimmed);
  title.value = "";
}
</script>

<template>
  <header class="header">
    <h1>todos</h1>
    <input
      class="new-todo"
      placeholder="What needs to be done?"
      autofocus
      v-model="title"
      @keyup.enter="submit"
    />
  </header>
</template>
