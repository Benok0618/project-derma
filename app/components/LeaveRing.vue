<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    used: number
    credits: number
    remaining: number
    label: string
    unlimited?: boolean
  }>(),
  { unlimited: false },
)

const RADIUS = 42
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const progress = ref(0)

const ratio = computed(() => {
  if (props.unlimited) return 0
  if (props.credits <= 0) return 0
  return Math.min(1, Math.max(0, props.used / props.credits))
})

const dash = computed(() => CIRCUMFERENCE * (1 - progress.value))

onMounted(() => {
  requestAnimationFrame(() => {
    progress.value = ratio.value
  })
})
</script>

<template>
  <figure class="leave-ring" :class="{ 'is-unlimited': props.unlimited }">
    <svg viewBox="0 0 100 100" role="img" :aria-label="`${props.label}: ${props.remaining} of ${props.credits} remaining`">
      <circle class="ring-track" cx="50" cy="50" :r="RADIUS" />
      <circle
        class="ring-value"
        cx="50"
        cy="50"
        :r="RADIUS"
        :stroke-dasharray="CIRCUMFERENCE"
        :stroke-dashoffset="dash"
      />
      <text class="ring-count" x="50" y="47" text-anchor="middle">
        {{ props.unlimited ? '∞' : `${props.used}/${props.credits}` }}
      </text>
      <text class="ring-sub" x="50" y="62" text-anchor="middle">
        {{ props.unlimited ? 'no limit' : `${props.remaining} left` }}
      </text>
    </svg>
    <figcaption class="ring-label">{{ props.label }}</figcaption>
  </figure>
</template>
