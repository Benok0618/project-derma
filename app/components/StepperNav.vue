<script setup lang="ts">
import { computed } from 'vue'
import { bookingSteps } from '~/data/clinic'

const props = defineProps<{ current: number }>()
const emit = defineEmits<{ navigate: [index: number] }>()

const fill = computed(() => `${(props.current / (bookingSteps.length - 1)) * 100}%`)
</script>

<template>
  <nav class="stepper" aria-label="Booking progress">
    <div class="stepper-track" aria-hidden="true">
      <div class="stepper-fill" :style="{ width: fill }" />
    </div>
    <ol class="stepper-list">
      <li
        v-for="(step, index) in bookingSteps"
        :key="step.key"
        class="stepper-item"
        :class="{
          'is-current': index === current,
          'is-done': index < current,
          'is-clickable': index <= current,
        }"
        :aria-current="index === current ? 'step' : undefined"
      >
        <button
          v-if="index <= current"
          type="button"
          class="stepper-dot"
          :aria-label="`Go to step ${index + 1}: ${step.label}`"
          @click="emit('navigate', index)"
        >
          <AppIcon v-if="index < current" name="check" />
          <template v-else>{{ index + 1 }}</template>
        </button>
        <span v-else class="stepper-dot" aria-hidden="true">{{ index + 1 }}</span>
        <span class="stepper-label">{{ step.short }}</span>
      </li>
    </ol>
  </nav>
</template>
