<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })

import { ref, computed, onMounted } from 'vue'
import { useHead } from '#imports'
import { useStore } from '~/composables/useStore'
import { useToast } from '~/composables/useToast'
import { formatClock, attendanceStatus, isLate, workedHours, formatHours, formatDateLabel, addDays, isoDate, formatStamp } from '~/utils/datetime'
import { uid } from '~/utils/id'

useHead({ title: 'Time Records — Lumi Derma Admin' })

const store = useStore()
const { success } = useToast()

const date = ref(isoDate())

const roles = ['HR Admin', 'Front Desk', 'Facialist'] as const

const filteredStaff = computed(() => {
  return store.activeStaff.value.filter(member => {
    const matchesRole = roleFilter.value === 'All' || member.role === roleFilter.value
    const matchesSearch = !search.value || `${member.firstName} ${member.lastName}`.toLowerCase().includes(search.value.toLowerCase())
    return matchesRole && matchesSearch
  })
})

const search = ref('')
const roleFilter = ref('All')
const statusFilter = ref('All')

const summaryCounts = computed(() => {
  const counts = { Present: 0, Late: 0, Absent: 0, 'Still Clocked In': 0 }
  filteredStaff.value.forEach(member => {
    const record = store.recordFor(member.id, date.value)
    const status = attendanceStatus(record)
    if (status === 'On Time') counts.Present++
    else if (status === 'Late') counts.Late++
    else if (status === 'Still Clocked In') counts['Still Clocked In']++
    else counts.Absent++
  })
  return counts
})

function recordStatusFilter(member: { id: string }) {
  const record = store.recordFor(member.id, date.value)
  const status = attendanceStatus(record)
  if (statusFilter.value === 'All') return true
  if (statusFilter.value === 'Present') return status === 'On Time'
  if (statusFilter.value === 'Late') return status === 'Late'
  if (statusFilter.value === 'Absent') return status === 'Absent'
  if (statusFilter.value === 'Still Clocked In') return status === 'Still Clocked In'
  return false
}

const displayedStaff = computed(() => filteredStaff.value.filter(recordStatusFilter))

function prevDay() {
  date.value = addDays(date.value, -1)
}
function nextDay() {
  date.value = addDays(date.value, 1)
}
function today() {
  date.value = isoDate()
}

function exportCSV() {
  const headers = ['Name', 'Role', 'Time In', 'Time Out', 'Total Hours', 'Status']
  const rows = displayedStaff.value.map(member => {
    const record = store.recordFor(member.id, date.value)
    const status = attendanceStatus(record)
    return [
      `${member.firstName} ${member.lastName}`,
      member.role,
      record?.timeIn ? formatClock(record.timeIn) : '—',
      record?.timeOut ? formatClock(record.timeOut) : '—',
      record?.timeIn && record?.timeOut ? formatHours(workedHours(record)) : '—',
      status,
    ]
  })
  const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `time-records-${date.value}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
  success('CSV downloaded.')
}
</script>

<template>
  <div>

    <div class="date-selector">
      <button type="button" class="btn btn-ghost" @click="prevDay">
        <AppIcon name="chevron-left" />
      </button>
      <span class="date-label">{{ formatDateLabel(date) }}</span>
      <button type="button" class="btn btn-ghost" @click="nextDay">
        <AppIcon name="chevron-right" />
      </button>
      <button type="button" class="btn btn-ghost" @click="today">Today</button>
    </div>

    <div class="summary-chips">
      <button
        type="button"
        class="summary-chip"
        :class="{ 'is-active': statusFilter === 'Present' }"
        @click="statusFilter = statusFilter === 'Present' ? 'All' : 'Present'"
      >
        <span class="chip-count">{{ summaryCounts.Present }}</span>
        <span class="chip-label">Present</span>
      </button>
      <button
        type="button"
        class="summary-chip"
        :class="{ 'is-active': statusFilter === 'Late' }"
        @click="statusFilter = statusFilter === 'Late' ? 'All' : 'Late'"
      >
        <span class="chip-count">{{ summaryCounts.Late }}</span>
        <span class="chip-label">Late</span>
      </button>
      <button
        type="button"
        class="summary-chip"
        :class="{ 'is-active': statusFilter === 'Absent' }"
        @click="statusFilter = statusFilter === 'Absent' ? 'All' : 'Absent'"
      >
        <span class="chip-count">{{ summaryCounts.Absent }}</span>
        <span class="chip-label">Absent</span>
      </button>
      <button
        type="button"
        class="summary-chip"
        :class="{ 'is-active': statusFilter === 'Still Clocked In' }"
        @click="statusFilter = statusFilter === 'Still Clocked In' ? 'All' : 'Still Clocked In'"
      >
        <span class="chip-count">{{ summaryCounts['Still Clocked In'] }}</span>
        <span class="chip-label">Still In</span>
      </button>
    </div>

    <div class="table-toolbar">
      <div class="toolbar-filters">
        <input
          v-model="search"
          type="search"
          placeholder="Search name…"
          class="search-input"
          style="width: 220px"
        />
        <select v-model="roleFilter" class="filter-select">
          <option value="All">All roles</option>
          <option v-for="r in roles" :key="r" :value="r">{{ r }}</option>
        </select>
        <button type="button" class="btn btn-outline" @click="exportCSV">
          <AppIcon name="chevron-right" style="margin-left: 6px" />
          Export CSV
        </button>
      </div>
    </div>

    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Time In</th>
            <th>Time Out</th>
            <th>Total Hours</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="member in displayedStaff" :key="member.id" :class="{ 'row-muted': !member.active }">
            <td>{{ member.firstName }} {{ member.lastName }}</td>
            <td>{{ member.role }}</td>
            <td>{{ store.recordFor(member.id, date)?.timeIn ? formatClock(store.recordFor(member.id, date)!.timeIn!) : '—' }}</td>
            <td>{{ store.recordFor(member.id, date)?.timeOut ? formatClock(store.recordFor(member.id, date)!.timeOut!) : '—' }}</td>
            <td>
              <span v-if="store.recordFor(member.id, date)?.timeIn && store.recordFor(member.id, date)?.timeOut">
                {{ formatHours(workedHours(store.recordFor(member.id, date)!)) }}
              </span>
              <span v-else class="muted">—</span>
            </td>
            <td>
              <StatusBadge :status="attendanceStatus(store.recordFor(member.id, date))" />
            </td>
          </tr>
          <tr v-if="!displayedStaff.length">
            <td colspan="6" class="center muted">No records for this filter.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>