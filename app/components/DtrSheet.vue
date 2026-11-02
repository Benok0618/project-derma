<script setup lang="ts">
import { computed } from 'vue'
import type { StaffAccount } from '~/types'
import { clinic } from '~/data/clinic'
import { useHr } from '~/composables/useHr'
import { formatClockTime, formatDecimalHours, monthLabel } from '~/utils/hr'

const props = defineProps<{
  employee: StaffAccount
  year: number
  month: number
}>()

const { dtrFor, settings } = useHr()

const sheet = computed(() => dtrFor(props.employee.id, props.year, props.month))
const period = computed(() => monthLabel(props.year, props.month))
const jobTitle = computed(() => props.employee.jobTitle || props.employee.role)
const printedOn = computed(() =>
  new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
)
</script>

<template>
  <article class="dtr-sheet" :aria-label="`Daily time record for ${employee.firstName} ${employee.lastName}`">
    <header class="dtr-head">
      <p class="dtr-clinic">{{ clinic.name }}</p>
      <p class="dtr-address">{{ clinic.address }}</p>
      <h2 class="dtr-title">DAILY TIME RECORD</h2>
      <p class="dtr-period">{{ period }}</p>
    </header>

    <div class="dtr-meta">
      <p><span class="dtr-meta-label">Employee</span> {{ employee.firstName }} {{ employee.lastName }}</p>
      <p><span class="dtr-meta-label">Job title</span> {{ jobTitle }}</p>
      <p><span class="dtr-meta-label">Official hours</span> {{ settings.requiredHours }}.00 hours per day</p>
    </div>

    <table class="dtr-table">
      <thead>
        <tr>
          <th scope="col">Day</th>
          <th scope="col">Time In</th>
          <th scope="col">Time Out</th>
          <th scope="col">Hours Worked</th>
          <th scope="col">Late (minutes)</th>
          <th scope="col">Remarks</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="day in sheet.days" :key="day.date">
          <td>
            <span class="dtr-day">{{ String(day.dayNumber).padStart(2, '0') }}</span>
            {{ day.weekdayLabel }}
          </td>
          <td>{{ formatClockTime(day.timeIn) }}</td>
          <td>{{ formatClockTime(day.timeOut) }}</td>
          <td>{{ formatDecimalHours(day.hours) }}</td>
          <td>{{ day.timeIn ? day.late : '—' }}</td>
          <td>{{ day.remark }}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td>Totals</td>
          <td>{{ sheet.totals.daysPresent }} present</td>
          <td>{{ sheet.totals.daysOnLeave }} on leave</td>
          <td>{{ formatDecimalHours(sheet.totals.totalHours) }}</td>
          <td>{{ sheet.totals.totalLate }}</td>
          <td>{{ sheet.totals.daysAbsent }} absent</td>
        </tr>
      </tfoot>
    </table>

    <div class="dtr-cert">
      <p>
        I certify that the above is a true and correct record of my daily attendance.
      </p>
      <div class="dtr-signatures">
        <div class="dtr-sign">
          <span class="dtr-sign-line" />
          <span class="dtr-sign-label">Employee</span>
        </div>
        <div class="dtr-sign">
          <span class="dtr-sign-line" />
          <span class="dtr-sign-label">Verified by (HR)</span>
        </div>
      </div>
      <p class="dtr-printed">Date printed: {{ printedOn }}</p>
    </div>
  </article>
</template>
