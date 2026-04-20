<script setup lang="ts">
import { computed } from "vue";
import { useStanValueAsync } from "@rkrupinski/stan/vue";

import { details } from "./state";

const props = defineProps<{ uid: string }>();

const query = computed(() => details(props.uid));

const data = useStanValueAsync(query);
</script>

<template>
  <template v-if="data.type === 'loading'">Loading&hellip;</template>
  <template v-else-if="data.type === 'error'">{{ String(data.reason) }}</template>
  <template v-else>{{ data.value.result.properties.name }}</template>
</template>
