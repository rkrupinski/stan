<script setup lang="ts">
import { atom } from "@rkrupinski/stan";
import { useStan } from "@rkrupinski/stan/vue";

const nameAtom = atom("", { tag: "Name" });
const subscribedAtom = atom(false, { tag: "Subscribed" });

const name = useStan(nameAtom);
const subscribed = useStan(subscribedAtom);
</script>

<template>
  <p>
    <label>Name: <input v-model="name" /></label>
  </p>
  <p>
    <label>
      <input type="checkbox" v-model="subscribed" />
      Subscribe to newsletter
    </label>
  </p>
  <p>
    Hello, {{ name || "stranger" }}!
    {{ subscribed ? "You're subscribed." : "" }}
  </p>
</template>
