<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ status: string }>()

const slug = computed(() =>
  props.status
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, ''),
)
</script>

<template>
  <span class="status-badge" :class="`is-${slug}`">{{ status }}</span>
</template>
