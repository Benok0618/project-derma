<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useHead } from '#imports'
import { useHr } from '~/composables/useHr'
import { useToast } from '~/composables/useToast'
import { addDays, formatLongDateLabel, isoDate } from '~/utils/datetime'
import { csvDownload, employeeLabel, formatClockTime, formatDecimalHours, STATUS_FILTERS } from '~/utils/hr'
import type { HrStatus } from '~/utils/hr'

definePageMeta({ layout: 'hr', middleware: 'auth' })
useHead({ title: 'Attendance — Lumi Derma HR' })

const { success, error: errorToast } = useToast()
const { rowsFor, settings, saveCorrection, toHhmm } = useHr()

const date = ref(isoDate())
const search = ref('')
const statusFilter = ref<'All' | 'Present' | HrStatus>('All')
const editOpen = ref(false)

const editForm = reactive({
  employeeId: '',
  timeIn: '',
  timeOut: '',
  reason: '',
  isNew: false,
})

const rows = computed(() => rowsFor(date.value))

const chips = computed(() => [
  { key: 'Present' as const, count: rows.value.filter((row) => row.record?.timeIn).length },
  ...STATUS_FILTERS.map((status) => ({
    key: status,
    count: rows.value.filter((row) => row.status === status).length,
  })),
])

const visible = computed(() => {
  const term = search.value.trim().toLowerCase()
  return rows.value.filter((row) => {
    const matchesSearch =
      !term ||
      [employeeLabel(row.employee), row.employee.email, row.employee.jobTitle ?? ''].some((field) =>
        field.toLowerCase().includes(term),
      )
    if (!matchesSearch) return false
    if (statusFilter.value === 'All') return true
    if (statusFilter.value === 'Present') return Boolean(row.record?.timeIn)
    return row.status === statusFilter.value
  })
})

function shiftDate(delta: number) {
  date.value = addDays(date.value, delta)
}

function toggleChip(key: 'All' | 'Present' | HrStatus) {
  statusFilter.value = statusFilter.value === key ? 'All' : key
}

function openEdit(row: (typeof rows.value)[number], isNew = false) {
  editForm.employeeId = row.employee.id
  editForm.timeIn = isNew ? '' : toHhmm(row.record?.timeIn)
  editForm.timeOut = isNew ? '' : toHhmm(row.record?.timeOut)
  editForm.reason = ''
  editForm.isNew = isNew
  editOpen.value = true
}

function saveEdit() {
  const result = saveCorrection({
    employeeId: editForm.employeeId,
    date: date.value,
    timeIn: editForm.timeIn,
    timeOut: editForm.timeOut,
    reason: editForm.reason,
    isNew: editForm.isNew,
  })
  if (!result.ok) {
    errorToast(result.error || 'Could not save the correction.')
    return
  }
  success(
    editForm.isNew
      ? 'Missing record added and logged to the audit log.'
      : 'Correction saved and logged to the audit log.',
  )
  editOpen.value = false
}

function exportCsv() {
  const header = [
    'Date',
    'Employee',
    'Job Title',
    'Time In',
    'Time Out',
    'Hours',
    'Late (min)',
    'Status',
    'Selfie',
    'Location',
    'Edited',
  ]
  const body = visible.value.map((row) => [
    date.value,
    employeeLabel(row.employee),
    row.employee.jobTitle || row.employee.role,
    row.record?.timeIn ? formatClockTime(row.record.timeIn) : '',
    row.record?.timeOut ? formatClockTime(row.record.timeOut) : '',
    row.hours != null ? row.hours.toFixed(2) : '',
    row.record?.timeIn ? String(row.lateMinutes) : '',
    row.status,
    row.record?.selfie ? 'Yes' : 'No',
    !settings.value.requireLocation ? 'Not required' : row.record?.locationVerified ? 'Verified' : 'Not verified',
    row.record?.edited ? 'Yes' : 'No',
  ])
  csvDownload(`attendance-${date.value}.csv`, [header, ...body])
  success(`Exported ${body.length} row${body.length === 1 ? '' : 's'} to CSV.`)
}
</script>

<template>
  <div class="hr-page">
    <header class="page-head v-reveal is-visible">
      <div>
        <h1>Attendance</h1>
        <p class="lede">Live daily log — corrections are written to the audit trail.</p>
      </div>
      <div class="date-nav">
        <button type="button" class="icon-btn" aria-label="Previous day" @click="shiftDate(-1)">
          <AppIcon name="chevron-left" />
        </button>
        <label class="visually-hidden" for="att-date">Attendance date</label>
        <input id="att-date" v-model="date" type="date" class="date-input" />
        <button type="button" class="icon-btn" aria-label="Next day" @click="shiftDate(1)">
          <AppIcon name="chevron-right" />
        </button>
        <button type="button" class="btn btn-ghost btn-sm" @click="date = isoDate()">Today</button>
      </div>
    </header>

    <p class="att-date-label v-reveal is-visible">{{ formatLongDateLabel(date) }}</p>

    <div class="chips summary-chips v-reveal is-visible" role="list" aria-label="Attendance summary filters">
      <button
        v-for="chip in chips"
        :key="chip.key"
        type="button"
        class="chip"
        :class="{ 'is-active': statusFilter === chip.key }"
        :aria-pressed="statusFilter === chip.key"
        @click="toggleChip(chip.key)"
      >
        {{ chip.key }}
        <strong>{{ chip.count }}</strong>
      </button>
      <button
        v-if="statusFilter !== 'All'"
        type="button"
        class="chip"
        @click="statusFilter = 'All'"
      >
        Clear filter
      </button>
    </div>

    <div class="toolbar v-reveal is-visible">
      <div class="search-box">
        <AppIcon name="search" />
        <input
          v-model="search"
          type="search"
          class="search-input"
          placeholder="Search employee…"
          aria-label="Search employees"
        />
      </div>
      <span class="muted">{{ visible.length }} shown</span>
      <button type="button" class="btn btn-outline btn-sm" @click="exportCsv">
        <AppIcon name="download" />
        Export CSV
      </button>
    </div>

    <section class="glass table-card v-reveal is-visible" :aria-label="`Attendance for ${date}`">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th scope="col">Employee</th>
              <th scope="col">Time In</th>
              <th scope="col">Time Out</th>
              <th scope="col">Hours</th>
              <th scope="col">Late</th>
              <th scope="col">Status</th>
              <th scope="col">Verification</th>
              <th scope="col"><span class="visually-hidden">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in visible" :key="row.employee.id">
              <td>
                <span class="cell-strong">{{ employeeLabel(row.employee) }}</span>
                <span class="cell-sub">{{ row.employee.jobTitle || row.employee.role }}</span>
              </td>
              <td>{{ formatClockTime(row.record?.timeIn) }}</td>
              <td>{{ formatClockTime(row.record?.timeOut) }}</td>
              <td>{{ formatDecimalHours(row.hours) }}</td>
              <td>{{ row.record?.timeIn ? `${row.lateMinutes} min` : '—' }}</td>
              <td>
                <div class="badge-stack">
                  <StatusBadge :status="row.status" />
                  <span
                    v-if="row.record?.edited"
                    class="status-badge is-edited"
                    :title="row.record.editReason || 'Corrected by HR'"
                  >
                    Edited
                  </span>
                </div>
              </td>
              <td>
                <div class="verify-cell">
                  <img
                    v-if="row.record?.selfie"
                    class="verify-thumb"
                    :src="row.record.selfie"
                    :alt="`Selfie of ${employeeLabel(row.employee)}`"
                    :title="`Selfie captured ${row.record.timeIn ? formatClockTime(row.record.timeIn) : ''}`"
                  />
                  <span v-else class="verify-flag is-warn">No selfie</span>
                  <span
                    v-if="settings.requireLocation"
                    class="verify-flag"
                    :class="row.record?.locationVerified ? 'is-ok' : 'is-warn'"
                  >
                    {{ row.record?.locationVerified ? 'Location verified' : 'Location not verified' }}
                  </span>
                </div>
              </td>
              <td class="row-actions">
                <button
                  v-if="row.record?.timeIn"
                  type="button"
                  class="btn btn-ghost btn-sm"
                  @click="openEdit(row)"
                >
                  <AppIcon name="edit" />
                  Edit
                </button>
                <button
                  v-else-if="row.status === 'Absent'"
                  type="button"
                  class="btn btn-ghost btn-sm"
                  @click="openEdit(row, true)"
                >
                  <AppIcon name="plus" />
                  Add record
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="!visible.length" class="empty-state">
        <span class="icon"><AppIcon name="clock" /></span>
        <p>No employees match this view.</p>
      </div>
    </section>

    <AppModal
      v-model:open="editOpen"
      :title="editForm.isNew ? 'Add missing record' : 'Edit time record'"
      subtitle="Every correction is saved to the audit log with your name and reason."
    >
      <form class="field-grid-2" novalidate @submit.prevent="saveEdit">
        <div class="field">
          <label for="edit-in">Time in</label>
          <input id="edit-in" v-model="editForm.timeIn" type="time" />
        </div>
        <div class="field">
          <label for="edit-out">Time out</label>
          <input id="edit-out" v-model="editForm.timeOut" type="time" />
        </div>
        <div class="field span-2" :class="{ 'has-error': !editForm.reason.trim() && editForm.reason.length > 0 }">
          <label for="edit-reason">Reason (required)</label>
          <textarea
            id="edit-reason"
            v-model="editForm.reason"
            rows="3"
            placeholder="e.g. kiosk froze — arrival verified against the front desk log"
          />
          <p v-if="editForm.reason.length > 0 && !editForm.reason.trim()" class="field-error">
            A reason is required.
          </p>
        </div>
      </form>
      <template #footer>
        <button type="button" class="btn btn-ghost" @click="editOpen = false">Cancel</button>
        <button type="button" class="btn btn-primary" :disabled="!editForm.reason.trim()" @click="saveEdit">
          <AppIcon name="check" />
          Save correction
        </button>
      </template>
    </AppModal>
  </div>
</template>
