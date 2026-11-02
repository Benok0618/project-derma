<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { useBooking } from '~/composables/useBooking'
import { formatDuration, formatPeso } from '~/utils/format'

withDefaults(
  defineProps<{
    title?: string
    sticky?: boolean
  }>(),
  { title: 'Selected services', sticky: false },
)

const { selectedServices, subtotal, totalDuration, selectService } = useBooking()

const listId = `tray-list-${useId()}`
const expanded = ref(false)

/** Lists of more than three services start collapsed so they never cover the page. */
const canCollapse = computed(() => selectedServices.value.length > 3)
const showList = computed(() => expanded.value || !canCollapse.value)
</script>

<template>
  <section
    v-if="selectedServices.length"
    class="tray"
    :class="{ 'tray-sticky': sticky }"
    aria-live="polite"
    aria-label="Selected services"
  >
    <div class="tray-head">
      <h3 class="tray-title">
        {{ title }}
        <span class="tray-count">{{ selectedServices.length }}</span>
      </h3>
      <div class="tray-total">
        <span>{{ formatPeso(subtotal) }}</span>
        <small>{{ formatDuration(totalDuration) }} total</small>
      </div>
    </div>

    <button
      v-if="canCollapse"
      type="button"
      class="tray-toggle"
      :aria-expanded="expanded"
      :aria-controls="listId"
      @click="expanded = !expanded"
    >
      <AppIcon :name="expanded ? 'chevron-up' : 'chevron-down'" />
      {{ expanded ? 'Hide selected services' : `View all ${selectedServices.length} services` }}
    </button>

    <ul v-show="showList" :id="listId" class="tray-list">
      <li v-for="svc in selectedServices" :key="svc.id">
        <span class="tray-item-name">{{ svc.name }}</span>
        <span class="tray-item-meta">{{ formatDuration(svc.durationMinutes) }}</span>
        <span class="tray-item-price">{{ formatPeso(svc.price) }}</span>
        <button
          type="button"
          class="tray-remove"
          :aria-label="`Remove ${svc.name}`"
          :title="`Remove ${svc.name}`"
          @click="selectService(svc.id, false)"
        >
          <AppIcon name="x" />
        </button>
      </li>
    </ul>

    <slot />
  </section>
</template>
