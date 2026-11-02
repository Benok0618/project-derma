<script setup lang="ts">
import { computed, ref } from 'vue'
import { useHead } from '#imports'
import { useAuth } from '~/composables/useAuth'
import { useHr, shiftMonth } from '~/composables/useHr'
import { formatDateLabel, formatHours, isoDate } from '~/utils/datetime'
import { formatClockTime, formatDecimalHours, monthDateList, monthLabel, hoursOf } from '~/utils/hr'

definePageMeta({ layout: 'staff', middleware: 'auth' })
useHead({ title: 'My Records — Lumi Derma Staff' })

const { currentUser } = useAuth()
const { recordOf, statusOf } = useHr()

const now = new Date()
const view = ref({ year: now.getFullYear(), month: now.getMonth() })

const dates = computed(() => monthDateList(view.value.year, view.value.month))
const title = computed(() => monthLabel(view.value.year, view.value.month))

const rows = computed(() => {
  const id = currentUser.value?.id
  if (!id) return []
  return dates.value
    .map((date) => {
      const record = recordOf(id, date)
      return {
        date,
        record,
        status: statusOf(id, date),
        hours: hoursOf(record),
      }
    })
    .slice()
    .reverse()
})

const summary = computed(() => {
  const list = rows.value.filter((row) => row.record?.timeIn || row.status === 'On Leave')
  const present = rows.value.filter((row) => row.record?.timeIn).length
  const late = rows.value.filter((row) => row.status === 'Late').length
  const onLeave = rows.value.filter((row) => row.status === 'On Leave').length
  const total = rows.value.reduce((sum, row) => sum + (row.hours ?? 0), 0)
  return { present, late, onLeave, total, counted: list.length }
})

function shift(delta: number) {
  view.value = shiftMonth(view.value.year, view.value.month, delta)
}
</script>

<template>
  <div class="staff-page">
    <header class="page-head v-reveal is-visible">
      <div>
        <h1>My Records</h1>
        <p class="lede">Your own daily time records — one row per day.</p>
      </div>
      <div class="month-picker">
        <button type="button" class="icon-btn" aria-label="Previous month" @click="shift(-1)">
          <AppIcon name="chevron-left" />
        </button>
        <span class="month-label" aria-live="polite">{{ title }}</span>
        <button type="button" class="icon-btn" aria-label="Next month" @click="shift(1)">
          <AppIcon name="chevron-right" />
        </button>
      </div>
    </header>

    <div class="chips summary-chips v-reveal is-visible" role="list" aria-label="Month summary">
      <span class="chip" role="listitem">{{ summary.present }} days present</span>
      <span class="chip" role="listitem">{{ summary.late }} late</span>
      <span class="chip" role="listitem">{{ summary.onLeave }} on leave</span>
      <span class="chip" role="listitem">{{ formatHours(summary.total) }} total</span>
    </div>

    <section class="glass table-card v-reveal is-visible" aria-label="Daily records">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Time In</th>
              <th scope="col">Time Out</th>
              <th scope="col">Hours</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.date" :class="{ 'row-muted': row.status === 'Day Off' }">
              <td>
                <span class="cell-strong">{{ formatDateLabel(row.date) }}</span>
              </td>
              <td>{{ formatClockTime(row.record?.timeIn) }}</td>
              <td>{{ formatClockTime(row.record?.timeOut) }}</td>
              <td>{{ formatDecimalHours(row.hours) }}</td>
              <td><StatusBadge :status="row.status" /></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="!rows.length" class="empty-state">
        <span class="icon"><AppIcon name="calendar" /></span>
        <p>No records for {{ title }} yet.</p>
      </div>
    </section>
  </div>
</template>
