<script setup lang="ts">
import { computed } from "vue";
import { useStanValueAsync, useStanRefresh } from "@rkrupinski/stan/vue";

import { swSearch } from "./state";

const props = defineProps<{ phrase: string }>();

const query = computed(() => swSearch(props.phrase));

const data = useStanValueAsync(query);
const refresh = useStanRefresh(query);
</script>

<template>
  <div class="resultsContainer">
    <p v-if="data.type === 'loading'" class="text">Loading&hellip;</p>
    <template v-else-if="data.type === 'error'">
      <p class="text">{{ String(data.reason) }}</p>
      <button @click="refresh">Try again</button>
    </template>
    <template v-else>
      <ul v-if="data.value.result.length" class="results">
        <li
          v-for="{ properties: { name, url } } in data.value.result.slice(0, 5)"
          :key="url"
          class="result"
        >
          <a :href="url" target="_blank" rel="noopener noreferrer">{{ name }}</a>
        </li>
      </ul>
      <p v-else class="text">No results</p>
    </template>
  </div>
</template>

<style scoped>
.resultsContainer {
  width: 250px;
  padding: 0.25rem;
  position: absolute;
  left: 0;
  top: calc(100% + 2px);
  border: 1px dotted #000;
  border-radius: 0.25rem;
  background: #fff;
}

.results {
  list-style: none;
  padding: 0;
  margin: 0;
}

.result:not(:first-child)::before {
  content: "";
  display: block;
  margin: 0.25rem 0;
  border-top: 1px dotted #000;
}

.text {
  margin: 0;
}
</style>
