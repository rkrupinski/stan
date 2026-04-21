<script setup lang="ts">
import { useStan, useStanValue, useStanCallback } from "@rkrupinski/stan/vue";

import {
  todosAtom,
  filterAtom,
  activeCount,
  completedCount,
  hasTodos,
  type Filter,
} from "./state";

const any = useStanValue(hasTodos);
const filter = useStan(filterAtom);
const active = useStanValue(activeCount);
const completed = useStanValue(completedCount);

const clearCompleted = useStanCallback(({ set }) => () => {
  set(todosAtom, (prev) => prev.filter((todo) => !todo.completed));
});

const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
];
</script>

<template>
  <footer v-show="any" class="footer">
    <span class="todo-count">
      <strong>{{ active }}</strong>
      {{ active === 1 ? "item" : "items" }} left
    </span>
    <ul class="filters">
      <li v-for="{ value, label } in filters" :key="value">
        <a
          :class="{ selected: filter === value }"
          href="#"
          @click.prevent="filter = value"
          >{{ label }}</a
        >
      </li>
    </ul>
    <button
      v-show="completed"
      class="clear-completed"
      @click="clearCompleted()"
    >
      Clear completed
    </button>
  </footer>
</template>
