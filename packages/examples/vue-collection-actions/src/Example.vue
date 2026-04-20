<script setup lang="ts">
import { useStanCallback } from "@rkrupinski/stan/vue";

import Details from "./Details.vue";
import { details } from "./state";

const UIDS = Array.from({ length: 5 }, (_, i) => `${i + 1}`);

const refreshItem = useStanCallback(({ refresh }) => (uid: string) => {
  refresh(details(uid));
});
</script>

<template>
  <table class="table" border="1">
    <thead>
      <tr>
        <th>Name</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="uid in UIDS" :key="uid">
        <td>
          <Details :uid="uid" />
        </td>
        <td>
          <button @click="refreshItem(uid)">Refresh</button>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
.table {
  border-collapse: collapse;
}

.table td,
.table th {
  padding: 0.25rem;
}

.table td:first-child,
.table th:first-child {
  width: 200px;
  text-align: left;
}
</style>
