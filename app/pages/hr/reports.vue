<script setup lang="ts">
import { computed, nextTick, reactive, ref } from 'vue'
import { useHead } from '#imports'
import { useHr, shiftMonth } from '~/composables/useHr'
import { useToast } from '~/composables/useToast'
import { formatStamp } from '~/utils/datetime'
import { csvDownload, employeeLabel, monthLabel, monthShortLabel } from '~/utils/hr'

definePageMeta({ layout: 'hr', middleware: 'auth' })
useHead({ title: 'Reports — Lumi Derma HR' })

const { success } = useToast()
const { activeEmployees, summaryFor, leaveTypes, balanceOf, auditLog, settings } = useHr()

const now = new Date()
const view = ref({ year: now.getFullYear(), month: now.getMonth() })
const employeeFilter = ref('All')
const latenessView = ref<'chart' | 'table'>('chart')
const activePrint = ref<string | null>(null)

const auditFilters = reactive({ action: 'All', search: '', from: '', to: '' })

const tip = ref<{ x: number; y: number; text: string } | null>(null)
const pageEl = ref<HTMLElement | null>(null)

const periodLabel = computed(() => monthLabel(view.value.year, view.value.month))
const periodShort = computed(() => monthShortLabel(view.value.year, view.value.month))

const employeeOptions = computed(() => [
  { id: 'All', label: 'All employees' },
  ...activeEmployees.value.map((member) => ({ id: member.id, label: employeeLabel(member) })),
])

const scoped = computed(() =>
  employeeFilter.value === 'All'
    ? activeEmployees.value
    : activeEmployees.value.filter((member) => member.id === employeeFilter.value),
)

const attendanceRows = computed(() =>
  scoped.value.map((member) => ({
    employee: member,
    summary: summaryFor(member.id, view.value.year, view.value.month),
  })),
)

const donut = computed(() => {
  const rows = attendanceRows.value.map((row) => row.summary)
  const late = rows.reduce((sum, row) => sum + row.lateCount, 0)
  const present = rows.reduce((sum, row) => sum + row.daysPresent, 0)
  const absent = rows.reduce((sum, row) => sum + row.absences, 0)
  const onLeave = rows.reduce((sum, row) => sum + row.leaves, 0)
  const onTime = Math.max(0, present - late)
  const segments = [
    { label: 'On time days', value: onTime, cls: 'is-on-time' },
    { label: 'Late arrivals', value: late, cls: 'is-late' },
    { label: 'Absences', value: absent, cls: 'is-absent' },
    { label: 'Leave days', value: onLeave, cls: 'is-on-leave' },
  ].filter((segment) => segment.value > 0)
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1
  const circumference = 2 * Math.PI * 45
  let offset = 0
  const withGeometry = segments.map((segment) => {
    const len = (segment.value / total) * circumference
    const geometry = { ...segment, len, offset, pct: Math.round((segment.value / total) * 100) }
    offset += len
    return geometry
  })
  return { segments: withGeometry, total, circumference }
})

const latenessRows = computed(() =>
  attendanceRows.value
    .filter((row) => row.summary.lateCount > 0)
    .map((row) => ({
      name: employeeLabel(row.employee),
      days: row.summary.lateCount,
      minutes: row.summary.lateMinutes,
      avg: row.summary.lateMinutes / row.summary.lateCount,
    }))
    .sort((a, b) => b.minutes - a.minutes),
)

const latenessMax = computed(() => Math.max(1, ...latenessRows.value.map((row) => row.minutes)))
const chartRowH = 34
const chartW = 640
const labelW = 170
const barArea = chartW - labelW - 90
const chartH = computed(() => Math.max(chartRowH + 24, latenessRows.value.length * chartRowH + 16))

function barWidth(minutes: number) {
  return Math.max(6, (minutes / latenessMax.value) * barArea)
}

const leaveRows = computed(() =>
  scoped.value.map((member) => ({
    employee: member,
    cells: leaveTypes.value
      .filter((type) => type.active)
      .map((type) => ({ type, balance: balanceOf(member.id, type) })),
  })),
)

const auditActions = computed(() => [...new Set(auditLog.value.map((entry) => entry.action))])

const corrections = computed(() => {
  const term = auditFilters.search.trim().toLowerCase()
  return auditLog.value
    .filter((entry) => {
      if (auditFilters.action !== 'All' && entry.action !== auditFilters.action) return false
      if (auditFilters.from && entry.at.slice(0, 10) < auditFilters.from) return false
      if (auditFilters.to && entry.at.slice(0, 10) > auditFilters.to) return false
      if (!term) return true
      return [entry.employeeName, entry.reason, entry.by, entry.action].some((field) =>
        field.toLowerCase().includes(term),
      )
    })
    .slice()
    .sort((a, b) => (a.at < b.at ? 1 : -1))
})

function shift(delta: number) {
  view.value = shiftMonth(view.value.year, view.value.month, delta)
}

function showTip(event: Event, text: string) {
  const page = pageEl.value
  if (!page) return
  const rect = page.getBoundingClientRect()
  const target = (event.currentTarget as HTMLElement).getBoundingClientRect()
  if (event instanceof MouseEvent && event.clientX > 0) {
    tip.value = { x: event.clientX - rect.left, y: event.clientY - rect.top - 12, text }
    return
  }
  tip.value = {
    x: target.left - rect.left + target.width / 2,
    y: target.top - rect.top - 12,
    text,
  }
}

function latenessTip(event: Event, row: (typeof latenessRows.value)[number]) {
  showTip(
    event,
    `${row.name} — ${row.minutes} min late across ${row.days} day${row.days === 1 ? '' : 's'}`,
  )
}

function donutTip(event: Event, segment: (typeof donut.value.segments)[number]) {
  showTip(event, `${segment.label} — ${segment.value} day${segment.value === 1 ? '' : 's'} (${segment.pct}%)`)
}

function printCard(key: string) {
  const restore = latenessView.value
  if (key === 'lateness') latenessView.value = 'table'
  activePrint.value = key
  nextTick(() => {
    const done = () => {
      activePrint.value = null
      latenessView.value = restore
      window.removeEventListener('afterprint', done)
    }
    window.addEventListener('afterprint', done)
    window.print()
    done()
  })
}

function exportAttendance() {
  csvDownload(`attendance-summary-${periodShort.value.replace(' ', '-')}.csv`, [
    ['Employee', 'Job Title', 'Days Present', 'Late Days', 'Late Minutes', 'Absent', 'On Leave', 'Hours'],
    ...attendanceRows.value.map((row) => [
      employeeLabel(row.employee),
      row.employee.jobTitle || row.employee.role,
      row.summary.daysPresent,
      row.summary.lateCount,
      row.summary.lateMinutes,
      row.summary.absences,
      row.summary.leaves,
      row.summary.totalHours.toFixed(2),
    ]),
  ])
  success('Attendance summary exported.')
}

function exportLateness() {
  csvDownload(`lateness-ranking-${periodShort.value.replace(' ', '-')}.csv`, [
    ['Employee', 'Late Days', 'Total Late Minutes', 'Average Minutes'],
    ...latenessRows.value.map((row) => [row.name, row.days, row.minutes, row.avg.toFixed(1)]),
  ])
  success('Lateness ranking exported.')
}

function exportLeaves() {
  csvDownload(`leave-utilization-${periodShort.value.replace(' ', '-')}.csv`, [
    ['Employee', 'Leave Type', 'Yearly Credits', 'Used', 'Remaining'],
    ...leaveRows.value.flatMap((row) =>
      row.cells.map((cell) => [
        employeeLabel(row.employee),
        cell.type.name,
        cell.balance.credits,
        cell.balance.used,
        cell.balance.unlimited ? 'No limit' : cell.balance.remaining,
      ]),
    ),
  ])
  success('Leave utilization exported.')
}

function exportCorrections() {
  csvDownload('corrections-log.csv', [
    ['Date', 'Recorded By', 'Action', 'Employee', 'Reason', 'Before', 'After'],
    ...corrections.value.map((entry) => [
      formatStamp(entry.at),
      entry.by,
      entry.action,
      entry.employeeName,
      entry.reason,
      entry.before,
      entry.after,
    ]),
  ])
  success('Corrections log exported.')
}
</script>

<template>
  <div ref="pageEl" class="hr-page">
    <header class="page-head v-reveal is-visible">
      <div>
        <h1>Reports</h1>
        <p class="lede">Print-ready summaries — every card exports to CSV too.</p>
      </div>
      <div class="report-filters">
        <div class="month-picker">
          <button type="button" class="icon-btn" aria-label="Previous month" @click="shift(-1)">
            <AppIcon name="chevron-left" />
          </button>
          <span class="month-label" aria-live="polite">{{ periodLabel }}</span>
          <button type="button" class="icon-btn" aria-label="Next month" @click="shift(1)">
            <AppIcon name="chevron-right" />
          </button>
        </div>
        <label class="visually-hidden" for="rep-employee">Employee filter</label>
        <select id="rep-employee" v-model="employeeFilter" class="filter-select">
          <option v-for="option in employeeOptions" :key="option.id" :value="option.id">
            {{ option.label }}
          </option>
        </select>
      </div>
    </header>

    <div class="report-grid">
      <section class="report-card glass v-reveal is-visible" aria-labelledby="rep-attendance">
        <div class="report-head">
          <div>
            <h2 id="rep-attendance" class="section-title">Attendance summary</h2>
            <p class="muted">{{ periodLabel }} · {{ scoped.length }} employee{{ scoped.length === 1 ? '' : 's' }}</p>
          </div>
          <div class="report-actions no-print">
            <button type="button" class="btn btn-outline btn-sm" @click="exportAttendance">
              <AppIcon name="download" />
              CSV
            </button>
            <button type="button" class="btn btn-soft btn-sm" @click="printCard('attendance')">
              <AppIcon name="printer" />
              Print
            </button>
          </div>
        </div>

        <div class="print-root" :class="{ 'is-passive': activePrint && activePrint !== 'attendance' }">
          <div class="report-print-head">
            <h2>Attendance summary — {{ periodLabel }}</h2>
            <p>Lumi Derma Studio · generated {{ periodShort }}</p>
          </div>

          <div class="attendance-report-body">
            <div
              class="donut-wrap"
              @mouseleave="tip = null"
            >
              <svg
                class="donut"
                viewBox="0 0 120 120"
                role="img"
                aria-label="Attendance distribution donut chart"
              >
                <g transform="rotate(-90 60 60)">
                  <circle
                    v-for="segment in donut.segments"
                    :key="segment.label"
                    class="donut-seg"
                    :class="segment.cls"
                    cx="60"
                    cy="60"
                    r="45"
                    fill="none"
                    stroke-width="16"
                    tabindex="0"
                    :stroke-dasharray="`${segment.len} ${donut.circumference - segment.len}`"
                    :stroke-dashoffset="-segment.offset"
                    @mousemove="donutTip($event, segment)"
                    @focus="donutTip($event, segment)"
                    @blur="tip = null"
                  />
                </g>
                <text x="60" y="57" text-anchor="middle" class="donut-center-value">
                  {{ donut.total }}
                </text>
                <text x="60" y="72" text-anchor="middle" class="donut-center-label">days</text>
              </svg>
              <ul class="donut-legend">
                <li v-for="segment in donut.segments" :key="segment.label" :class="segment.cls">
                  <span class="dot" aria-hidden="true" />
                  {{ segment.label }}
                  <strong>{{ segment.value }}</strong>
                  <span class="muted">{{ segment.pct }}%</span>
                </li>
              </ul>
            </div>

            <div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th scope="col">Employee</th>
                    <th scope="col">Present</th>
                    <th scope="col">Late</th>
                    <th scope="col">Late min</th>
                    <th scope="col">Absent</th>
                    <th scope="col">On leave</th>
                    <th scope="col">Hours</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in attendanceRows" :key="row.employee.id">
                    <td>
                      <span class="cell-strong">{{ employeeLabel(row.employee) }}</span>
                      <span class="cell-sub">{{ row.employee.jobTitle || row.employee.role }}</span>
                    </td>
                    <td>{{ row.summary.daysPresent }}</td>
                    <td>{{ row.summary.lateCount }}</td>
                    <td>{{ row.summary.lateMinutes }}</td>
                    <td>{{ row.summary.absences }}</td>
                    <td>{{ row.summary.leaves }}</td>
                    <td>{{ row.summary.totalHours.toFixed(2) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-if="!attendanceRows.length" class="empty-state">
            <span class="icon"><AppIcon name="chart" /></span>
            <p>No employees to report on yet.</p>
          </div>
        </div>
      </section>

      <section class="report-card glass v-reveal is-visible" aria-labelledby="rep-lateness">
        <div class="report-head">
          <div>
            <h2 id="rep-lateness" class="section-title">Lateness ranking</h2>
            <p class="muted">{{ periodLabel }} · grace {{ settings.graceMinutes }} minutes</p>
          </div>
          <div class="report-actions no-print">
            <button
              type="button"
              class="btn btn-ghost btn-sm"
              :aria-pressed="latenessView === 'table'"
              @click="latenessView = latenessView === 'chart' ? 'table' : 'chart'"
            >
              {{ latenessView === 'chart' ? 'View as table' : 'View as chart' }}
            </button>
            <button type="button" class="btn btn-outline btn-sm" @click="exportLateness">
              <AppIcon name="download" />
              CSV
            </button>
            <button type="button" class="btn btn-soft btn-sm" @click="printCard('lateness')">
              <AppIcon name="printer" />
              Print
            </button>
          </div>
        </div>

        <div class="print-root" :class="{ 'is-passive': activePrint && activePrint !== 'lateness' }">
          <div class="report-print-head">
            <h2>Lateness ranking — {{ periodLabel }}</h2>
            <p>Lumi Derma Studio · grace period {{ settings.graceMinutes }} minutes</p>
          </div>

          <template v-if="latenessRows.length">
            <div
              v-show="latenessView === 'chart'"
              class="chart-wrap"
              @mouseleave="tip = null"
            >
              <svg
                class="bar-chart"
                :viewBox="`0 0 ${chartW} ${chartH}`"
                role="img"
                aria-label="Horizontal bar chart ranking employees by total late minutes"
              >
                <g v-for="(row, index) in latenessRows" :key="row.name">
                  <text
                    class="bar-label"
                    x="0"
                    :y="index * chartRowH + chartRowH / 2 + 5"
                  >{{ row.name }}</text>
                  <rect
                    class="bar"
                    :x="labelW"
                    :y="index * chartRowH + 8"
                    :width="barWidth(row.minutes)"
                    :height="chartRowH - 16"
                    rx="7"
                    tabindex="0"
                    @mousemove="latenessTip($event, row)"
                    @focus="latenessTip($event, row)"
                    @blur="tip = null"
                  />
                  <text
                    class="bar-value"
                    :x="labelW + barWidth(row.minutes) + 10"
                    :y="index * chartRowH + chartRowH / 2 + 5"
                  >{{ row.minutes }} min</text>
                </g>
              </svg>
              <p class="chart-hint">Hover or focus a bar for details.</p>
            </div>

            <div v-show="latenessView === 'table'" class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Employee</th>
                    <th scope="col">Late days</th>
                    <th scope="col">Total minutes</th>
                    <th scope="col">Average / day</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, index) in latenessRows" :key="row.name">
                    <td>{{ index + 1 }}</td>
                    <td><span class="cell-strong">{{ row.name }}</span></td>
                    <td>{{ row.days }}</td>
                    <td>{{ row.minutes }} min</td>
                    <td>{{ row.avg.toFixed(1) }} min</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>

          <div v-else class="empty-state">
            <span class="icon"><AppIcon name="clock" /></span>
            <p>Nobody was late in {{ periodLabel }} — lovely.</p>
          </div>
        </div>
      </section>

      <section class="report-card glass v-reveal is-visible" aria-labelledby="rep-leaves">
        <div class="report-head">
          <div>
            <h2 id="rep-leaves" class="section-title">Leave utilization</h2>
            <p class="muted">Year-to-date credits vs used, per employee.</p>
          </div>
          <div class="report-actions no-print">
            <button type="button" class="btn btn-outline btn-sm" @click="exportLeaves">
              <AppIcon name="download" />
              CSV
            </button>
            <button type="button" class="btn btn-soft btn-sm" @click="printCard('leaves')">
              <AppIcon name="printer" />
              Print
            </button>
          </div>
        </div>

        <div class="print-root" :class="{ 'is-passive': activePrint && activePrint !== 'leaves' }">
          <div class="report-print-head">
            <h2>Leave utilization — {{ periodLabel }}</h2>
            <p>Lumi Derma Studio · sample yearly credits</p>
          </div>

          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th scope="col">Employee</th>
                  <th
                    v-for="type in leaveTypes.filter((entry) => entry.active)"
                    :key="type.id"
                    scope="col"
                  >
                    {{ type.name }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in leaveRows" :key="row.employee.id">
                  <td>
                    <span class="cell-strong">{{ employeeLabel(row.employee) }}</span>
                    <span class="cell-sub">{{ row.employee.jobTitle || row.employee.role }}</span>
                  </td>
                  <td v-for="cell in row.cells" :key="cell.type.id">
                    <div
                      class="util-cell"
                      :title="`${cell.balance.used} of ${cell.balance.unlimited ? 'unlimited' : cell.balance.credits} used`"
                    >
                      <span class="util-num">
                        <strong>{{ cell.balance.unlimited ? '∞' : cell.balance.remaining }}</strong>
                        left
                      </span>
                      <span class="util-bar" aria-hidden="true">
                        <span
                          class="util-fill"
                          :style="{
                            width: cell.balance.unlimited
                              ? '100%'
                              : `${Math.max(0, Math.min(100, cell.balance.credits ? (cell.balance.used / cell.balance.credits) * 100 : 0))}%`,
                          }"
                        />
                      </span>
                      <span class="muted">{{ cell.balance.used }} used</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="!leaveRows.length" class="empty-state">
            <span class="icon"><AppIcon name="leaf" /></span>
            <p>No employees to report on yet.</p>
          </div>
        </div>
      </section>

      <section class="report-card glass v-reveal is-visible" aria-labelledby="rep-corrections">
        <div class="report-head">
          <div>
            <h2 id="rep-corrections" class="section-title">Corrections log</h2>
            <p class="muted">Audit trail of every record edit and balance adjustment.</p>
          </div>
          <div class="report-actions no-print">
            <button type="button" class="btn btn-outline btn-sm" @click="exportCorrections">
              <AppIcon name="download" />
              CSV
            </button>
            <button type="button" class="btn btn-soft btn-sm" @click="printCard('corrections')">
              <AppIcon name="printer" />
              Print
            </button>
          </div>
        </div>

        <div class="toolbar no-print">
          <div class="search-box">
            <AppIcon name="search" />
            <input
              v-model="auditFilters.search"
              type="search"
              class="search-input"
              placeholder="Search employee, reason…"
              aria-label="Search corrections log"
            />
          </div>
          <select v-model="auditFilters.action" class="filter-select" aria-label="Filter by action">
            <option value="All">All actions</option>
            <option v-for="action in auditActions" :key="action" :value="action">{{ action }}</option>
          </select>
          <label class="range-label">
            From
            <input v-model="auditFilters.from" type="date" class="date-input" aria-label="From date" />
          </label>
          <label class="range-label">
            To
            <input v-model="auditFilters.to" type="date" class="date-input" aria-label="To date" />
          </label>
        </div>

        <div class="print-root" :class="{ 'is-passive': activePrint && activePrint !== 'corrections' }">
          <div class="report-print-head">
            <h2>Corrections log</h2>
            <p>Lumi Derma Studio · {{ corrections.length }} entries</p>
          </div>

          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">By</th>
                  <th scope="col">Action</th>
                  <th scope="col">Employee</th>
                  <th scope="col">Reason</th>
                  <th scope="col">Before → After</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="entry in corrections" :key="entry.id">
                  <td>{{ formatStamp(entry.at) }}</td>
                  <td>{{ entry.by }}</td>
                  <td>
                    <span class="status-badge is-edited">{{ entry.action }}</span>
                  </td>
                  <td>{{ entry.employeeName }}</td>
                  <td>{{ entry.reason }}</td>
                  <td class="cell-sub">{{ entry.before }} → {{ entry.after }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="!corrections.length" class="empty-state">
            <span class="icon"><AppIcon name="edit" /></span>
            <p>No corrections match these filters.</p>
          </div>
        </div>
      </section>
    </div>

    <div v-if="tip" class="chart-tip" :style="{ left: `${tip.x}px`, top: `${tip.y}px` }" role="status">
      {{ tip.text }}
    </div>
  </div>
</template>
