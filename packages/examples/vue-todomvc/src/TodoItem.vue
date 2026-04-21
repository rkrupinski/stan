<script setup lang="ts">
import { nextTick, ref, useTemplateRef } from "vue";
import { useStanCallback } from "@rkrupinski/stan/vue";

import { todosAtom, type Todo } from "./state";

const props = defineProps<{ todo: Todo }>();

const editing = ref(false);
const draft = ref("");
const inputRef = useTemplateRef<HTMLInputElement>("input");

const toggle = useStanCallback(({ set }) => (id: string) => {
  set(todosAtom, (prev) =>
    prev.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo,
    ),
  );
});

const remove = useStanCallback(({ set }) => (id: string) => {
  set(todosAtom, (prev) => prev.filter((todo) => todo.id !== id));
});

const updateTitle = useStanCallback(
  ({ set }) =>
    (id: string, title: string) => {
      set(todosAtom, (prev) =>
        prev.map((todo) => (todo.id === id ? { ...todo, title } : todo)),
      );
    },
);

async function startEdit() {
  draft.value = props.todo.title;
  editing.value = true;

  await nextTick();
  inputRef.value?.focus();
}

function commit() {
  if (!editing.value) return;

  editing.value = false;

  const trimmed = draft.value.trim();

  if (!trimmed) {
    remove(props.todo.id);
  } else if (trimmed !== props.todo.title) {
    updateTitle(props.todo.id, trimmed);
  }
}

function cancel() {
  editing.value = false;
}
</script>

<template>
  <li :class="{ completed: todo.completed, editing }">
    <div class="view">
      <input
        class="toggle"
        type="checkbox"
        :checked="todo.completed"
        @change="toggle(todo.id)"
      />
      <label @dblclick="startEdit">{{ todo.title }}</label>
      <button class="destroy" @click="remove(todo.id)"></button>
    </div>
    <input
      v-if="editing"
      ref="input"
      class="edit"
      v-model="draft"
      @blur="commit"
      @keyup.enter="commit"
      @keyup.escape="cancel"
    />
  </li>
</template>
