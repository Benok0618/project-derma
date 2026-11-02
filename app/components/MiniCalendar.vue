<script setup lang="ts">
import { computed, ref } from 'vue'
import { toIso } from '~/utils/calendar'
import { monthLabel } from '~/utils/hr'

const props = defineProps<{
  marks: Array<{ date: string; label: string; kind: 'holiday' | 'leave' }>
}>()

const today = new Date()
const view = ref({ year: today.getFullYear(), month: today.getMonth() })

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const cells = computed(() => {
  const first = new Date(view.value.year, view.value.month, 1)
  const offset = first.getDay()
  const days = new Date(view.value.year, view.value.month + 1, 0).getDate()
  const list: Array<{ key: string; day: number | null; iso: string }> = []
  for (let i = 0; i < offset; i++) list.push({ key: `o${i}`, day: null, iso: '' })
  for (let day = 1; day <= days; day++) {
    list.push({ key: `d${day}`, day, iso: toIso(new Date(view.value.year, view.value.month, day)) })
  }
  while (list.length % 7 !== 0) list.push({ key: `t${list.length}`, day: null, iso: '' })
  return list
})

const marksByDate = computed(() => {
  const map = new Map<string, Array<{ label: string; kind: string }>>()
  for (const mark of props.marks) {
    const entry = map.get(mark.date) ?? []
    entry.push({ label: mark.label, kind: mark.kind })
    map.set(mark.date, entry)
  }
  return map
})

const title = computed(() => monthLabel(view.value.year, view.value.month))
const todayIso = toIso(new Date())

function shift(delta: number) {
  const date = new Date(view.value.year, view.value.month + delta, 1)
  view.value = { year: date.getFullYear(), month: date.getMonth() }
}
</script>

<template>
  <div class="mini-cal">
    <div class="mini-cal-head">
      <button type="button" class="icon-btn" aria-label="Previous month" @click="shift(-1)">
        <AppIcon name="chevron-left" />
      </button>
      <p class="mini-cal-title">{{ title }}</p>
      <button type="button" class="icon-btn" aria-label="Next month" @click="shift(1)">
        <AppIcon name="chevron-right" />
      </button>
    </div>

    <div class="mini-cal-grid" role="grid" :aria-label="`Calendar for ${title}`">
      <span v-for="name in weekdays" :key="name" class="mini-cal-dow" role="columnheader">
        {{ name[0] }}
      </span>
      <template v-for="cell in cells" :key="cell.key">
        <div
          v-if="cell.day"
          class="mini-cal-day"
          :class="{ 'is-today': cell.iso === todayIso }"
          role="gridcell"
          :aria-label="cell.iso"
        >
          <span class="mini-cal-num">{{ cell.day }}</span>
          <span class="mini-cal-dots">
            <i
              v-for="(mark, index) in marksByDate.get(cell.iso) ?? []"
              :key="index"
              class="mini-cal-dot"
              :class="`is-${mark.kind}`"
              :title="mark.label"
            />
          </span>
        </div>
        <div v-else class="mini-cal-day is-empty" role="gridcell" aria-hidden="true" />
      </template>
    </div>

    <div class="mini-cal-legend">
      <span><i class="mini-cal-dot is-holiday" /> Holiday</span>
      <span><i class="mini-cal-dot is-leave" /> Approved leave</span>
    </div>
  </div>
</template>
