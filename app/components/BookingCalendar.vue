<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useStore } from '~/composables/useStore'
import {
  bookedTimesFor,
  buildMonth,
  fullyBookedDates,
  longDate,
  monthLabel,
  slotsForDate,
  toIso,
  weekdayLabels,
} from '~/utils/calendar'

const props = defineProps<{ date: string; time: string }>()
const emit = defineEmits<{ 'select-date': [iso: string]; 'select-time': [time: string] }>()

const store = useStore()

const today = new Date()
const viewYear = ref(today.getFullYear())
const viewMonth = ref(today.getMonth())

const weekdays = weekdayLabels()
const todayIso = toIso(today)

const bookedSlots = computed(() => store.bookedSlots.value)
const fullDates = computed(() => fullyBookedDates(bookedSlots.value))

const months = computed(() => buildMonth(viewYear.value, viewMonth.value, today, fullDates.value))

const monthOffset = computed(() => (viewYear.value - today.getFullYear()) * 12 + (viewMonth.value - today.getMonth()))
const canGoBack = computed(() => monthOffset.value > 0)
const canGoForward = computed(() => monthOffset.value < 2)

const slots = computed(() =>
  props.date ? slotsForDate(props.date, bookedTimesFor(bookedSlots.value, props.date)) : [],
)

watch(
  () => props.date,
  (value) => {
    if (!value) return
    const parts = value.split('-').map(Number)
    viewYear.value = parts[0]!
    viewMonth.value = parts[1]! - 1
  },
)

function go(delta: number) {
  const next = new Date(viewYear.value, viewMonth.value + delta, 1)
  viewYear.value = next.getFullYear()
  viewMonth.value = next.getMonth()
}

function pick(day: { available: boolean; iso: string }) {
  if (!day.available) return
  emit('select-date', day.iso)
}
</script>

<template>
  <div class="calendar-layout">
    <div class="calendar">
      <div class="calendar-head">
        <button
          type="button"
          class="icon-btn"
          :disabled="!canGoBack"
          aria-label="Previous month"
          @click="go(-1)"
        >
          <AppIcon name="chevron-left" />
        </button>
        <p class="calendar-month" aria-live="polite">{{ monthLabel(viewYear, viewMonth) }}</p>
        <button
          type="button"
          class="icon-btn"
          :disabled="!canGoForward"
          aria-label="Next month"
          @click="go(1)"
        >
          <AppIcon name="chevron-right" />
        </button>
      </div>

      <div class="calendar-weekdays" aria-hidden="true">
        <span v-for="day in weekdays" :key="day">{{ day }}</span>
      </div>

      <div class="calendar-grid" role="grid" aria-label="Choose an available date">
        <template v-for="cell in months" :key="cell.iso">
          <span v-if="!cell.inMonth" class="cal-day is-outside" aria-hidden="true" />
          <button
            v-else
            type="button"
            class="cal-day"
            :class="{
              'is-disabled': !cell.available,
              'is-selected': cell.iso === date,
              'is-today': cell.iso === todayIso,
            }"
            :disabled="!cell.available"
            :tabindex="!cell.available ? -1 : undefined"
            :aria-label="`${longDate(cell.iso)}${cell.available ? '' : cell.isFull ? ', fully booked' : ', unavailable'}`"
            :aria-pressed="cell.iso === date"
            @click="pick(cell)"
          >
            {{ cell.day }}
          </button>
        </template>
      </div>

      <div class="calendar-legend">
        <span><i class="legend-swatch" style="background: var(--grad-primary)" />Selected</span>
        <span><i class="legend-swatch" style="border: 2px solid var(--aqua); background: #fff" />Today</span>
        <span><i class="legend-swatch" style="background: rgba(51,32,43,.18)" />Closed</span>
        <span><i class="legend-swatch" style="background: rgba(var(--rgb-blush-deep), 0.45)" />Booked</span>
      </div>
    </div>

    <div class="time-panel">
      <template v-if="date">
        <p class="eyebrow">Available times</p>
        <h3 style="margin-top: 6px">{{ longDate(date) }}</h3>
        <div class="time-slots">
          <button
            v-for="(slot, index) in slots"
            :key="slot.time"
            type="button"
            class="time-slot"
            :class="{ 'is-selected': slot.time === time }"
            :disabled="slot.taken"
            :aria-pressed="slot.time === time"
            :aria-label="`${slot.label}${slot.taken ? ', already booked' : ''}`"
            :style="{ animationDelay: `${index * 45}ms` }"
            @click="emit('select-time', slot.time)"
          >
            {{ slot.label }}
          </button>
        </div>
        <p v-if="slots.length && slots.every((slot) => slot.taken)" class="field-hint" style="margin-top: 12px">
          Every slot on this date is booked. Pick another day.
        </p>
      </template>
      <div v-else class="time-placeholder">
        <AppIcon name="calendar" />
        <p>Pick a date to see the hourly time slots available that day.</p>
      </div>
    </div>
  </div>
</template>
