<script setup lang="ts">
import { onMounted, ref, watch, computed } from 'vue'

const props = withDefaults(
  defineProps<{
    value: number | string
    duration?: number
    decimals?: number
    prefix?: string
    suffix?: string
  }>(),
  { duration: 900, decimals: 0, prefix: '', suffix: '' },
)

const display = ref(0)
let frame = 0

const isNumeric = computed(() => typeof props.value === 'number')

function format(value: number): string {
  return `${props.prefix}${value.toLocaleString('en-US', {
    minimumFractionDigits: props.decimals,
    maximumFractionDigits: props.decimals,
  })}${props.suffix}`
}

function animate(to: number, from: number) {
  if (typeof window === 'undefined') {
    display.value = to
    return
  }
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce || from === to) {
    display.value = to
    return
  }
  const start = performance.now()
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / props.duration)
    const eased = 1 - Math.pow(1 - t, 3)
    display.value = from + (to - from) * eased
    if (t < 1) frame = requestAnimationFrame(step)
    else display.value = to
  }
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(step)
}

onMounted(() => {
  if (isNumeric.value) {
    animate(props.value as number, 0)
  } else {
    display.value = 0
  }
})

watch(
  () => props.value,
  (to, from) => {
    if (isNumeric.value && typeof to === 'number' && typeof from === 'number') {
      animate(to, from)
    } else {
      display.value = 0
    }
  },
)
</script>

<template>
  <span class="counter">
    <span v-if="isNumeric">{{ format(display) }}</span>
    <span v-else>{{ value }}</span>
  </span>
</template>