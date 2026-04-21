<script setup lang="ts">
import { ref } from "vue";
import { makeStore } from "@rkrupinski/stan";
import { StanProvider } from "@rkrupinski/stan/vue";

import StateTest from "./StateTest.vue";

const stores = [makeStore(), makeStore(), makeStore()];
const storeIndex = ref(0);

const next = () => {
  storeIndex.value = (storeIndex.value + 1) % stores.length;
};
</script>

<template>
  <StanProvider :store="stores[storeIndex]">
    <button @click="next">Next store</button>
    <p>
      Active store:
      <span
        v-for="(_, i) in stores"
        :key="i"
        :style="i === storeIndex ? { border: '1px dotted black' } : undefined"
      >
        {{ i + 1 }}
      </span>
    </p>
    <StateTest />
  </StanProvider>
</template>
