<script setup lang="ts">
import { computed } from 'vue'
import type { Service } from '~/data/services'
import { formatDuration, formatPeso } from '~/utils/format'

const props = withDefaults(
  defineProps<{
    service: Service
    selectable?: boolean
    selected?: boolean
    large?: boolean
    showBadge?: boolean
  }>(),
  { selectable: false, selected: false, large: false, showBadge: true },
)

const emit = defineEmits<{ toggle: [id: string]; book: [id: string] }>()

const categoryIcons: Record<string, string> = {
  Consultation: 'face',
  'Acne & Scar': 'droplet',
  'Facial & Glow': 'sparkle',
  Laser: 'laser',
  'Anti-Aging': 'syringe',
  'Hair & Nails': 'hair',
  Body: 'body',
}

const iconName = computed(() => categoryIcons[props.service.category] ?? 'sparkle')
const tag = computed(() => (props.selectable ? 'button' : 'div'))

function activate() {
  if (props.selectable) emit('toggle', props.service.id)
}
</script>

<template>
  <component
    :is="tag"
    v-reveal
    class="service-card reveal"
    :class="{ 'is-selected': selected, 'service-card-lg': large }"
    :type="selectable ? 'button' : undefined"
    :aria-pressed="selectable ? selected : undefined"
    @click="activate"
  >
    <span v-if="selectable" class="select-check" aria-hidden="true">
      <AppIcon name="check" />
    </span>

    <div class="service-card-top">
      <span class="service-icon"><AppIcon :name="iconName" /></span>
      <span v-if="showBadge && service.popular" class="badge">
        <AppIcon name="sparkle" :size="13" /> Popular
      </span>
    </div>

    <span class="category">{{ service.category }}</span>
    <h3>{{ service.name }}</h3>
    <p class="desc">{{ service.description }}</p>

    <div class="service-meta">
      <span class="service-duration"><AppIcon name="clock" /> {{ formatDuration(service.durationMinutes) }}</span>
      <span class="service-price">{{ formatPeso(service.price) }}</span>
    </div>

    <button
      v-if="!selectable"
      type="button"
      class="btn btn-soft btn-sm"
      @click.stop="emit('book', service.id)"
    >
      Book this
    </button>
  </component>
</template>
