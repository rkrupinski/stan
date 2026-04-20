<script setup lang="ts">
import { computed, ref } from "vue";
import { refDebounced } from "@vueuse/core";

import Results from "./Results.vue";

const value = ref("");
const phrase = computed(() => value.value.trim().toLocaleLowerCase());
const debouncedPhrase = refDebounced(phrase, 300);
</script>

<template>
  <div class="container">
    <label for="search">Search Star Wars characters:</label>
    <div class="inputWrapper">
      <input id="search" v-model="value" />
      <Results
        v-if="debouncedPhrase.length"
        :key="debouncedPhrase"
        :phrase="debouncedPhrase"
      />
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.inputWrapper {
  position: relative;
}
</style>
