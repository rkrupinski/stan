<script setup lang="ts">
import { atom } from "@rkrupinski/stan";
import { useStan, useStanReset } from "@rkrupinski/stan/vue";

const myAtom = atom("default");

const value = useStan(myAtom);
const reset = useStanReset(myAtom);
</script>

<template>
  <input placeholder="Enter text" v-model="value" />
  <button @click="reset">Reset</button>
</template>
