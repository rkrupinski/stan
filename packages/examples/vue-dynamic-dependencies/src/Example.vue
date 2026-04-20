<script setup lang="ts">
import { atom, selector } from "@rkrupinski/stan";
import { useStan, useStanValue } from "@rkrupinski/stan/vue";

const dep1 = atom(0);

const dep2 = atom("hello");

const toggle = atom(false);

const result = selector(({ get }) => {
  console.log("result evaluated");

  if (get(toggle)) return get(dep1);

  return get(dep2);
});

const d1 = useStan(dep1);
const d2 = useStan(dep2);
const t = useStan(toggle);
const value = useStanValue(result);

const toggleDep = () => {
  t.value = !t.value;
};
</script>

<template>
  <label for="d1">dep1:</label>
  <input id="d1" name="d1" type="number" v-model.number="d1" />
  <br />
  <label for="d2">dep2:</label>
  <input id="d2" name="d2" type="text" v-model="d2" />
  <hr />
  <button @click="toggleDep">Toggle dep</button>
  <pre>result: {{ JSON.stringify(value) }}</pre>
</template>
