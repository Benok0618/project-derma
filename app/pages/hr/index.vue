<script setup lang="ts">
import { computed, ref } from 'vue'
import { useHead } from '#imports'
import { useAuth } from '~/composables/useAuth'
import { useHr } from '~/composables/useHr'
import { useToast } from '~/composables/useToast'
import { addDays, formatLongDateLabel, formatStamp, isoDate } from '~/utils/datetime'
import { employeeLabel, formatClockTime } from '~/utils/hr'

definePageMeta({ layout: 'hr', middleware: 'auth' })
useHead({ title: 'Overview — Lumi Derma HR' })

const { currentUser } = useAuth()
const { success, error: errorToast } = useToast()
const {
  todayStats,
  pendingRequests,
  approveRequest,
  rejectRequest,
  memberById,
  leaveTypes,
  holidays,
  leaveRequests,
} = useHr()

const today = isoDate()
const now = new Date()
const rejectTarget = ref<string | null>(null)
const rejectComment = ref('')

const marks = computed(() => {
  const list: Array<{ date: string; label: string; kind: 'holiday' | 'leave' }> = []
  for (const holiday of holidays.value) {
    list.push({ date: holiday.date, label: `${holiday.name} (${holiday.type})`, kind: 'holiday' })
  }
  for (const request of leaveRequests.value) {
    if (request.status !== 'Approved') continue
    const name = employeeLabel(memberById(request.employeeId))
    const type = leaveTypes.value.find((entry) => entry.id === request.typeId)?.name ?? 'Leave'
    let cursor = request.startDate
    let guard = 0
    while (cursor <= request.endDate && guard < 120) {
      list.push({ date: cursor, label: `${name} — ${type}`, kind: 'leave' })
      cursor = addDays(cursor, 1)
      guard += 1
    }
  }
  return list
})

function quickApprove(requestId: string) {
  const request = pendingRequests.value.find((entry) => entry.id === requestId)
  if (!request) return
  const result = approveRequest(request)
  if (!result.ok) {
    errorToast(result.error || 'Could not approve this request.')
    return
  }
  success('Leave approved — balance deducted and dates marked On Leave.')
}

function openReject(requestId: string) {
  rejectTarget.value = requestId
  rejectComment.value = ''
}

function confirmReject() {
  const request = pendingRequests.value.find((entry) => entry.id === rejectTarget.value)
  if (!request) return
  const result = rejectRequest(request, rejectComment.value)
  if (!result.ok) {
    errorToast(result.error || 'Could not reject this request.')
    return
  }
  success('Leave rejected — the employee can see your comment.')
  rejectTarget.value = null
}
</script>

<template>
  <div class="hr-page">
    <header class="page-head v-reveal is-visible">
      <div>
        <h1>Good {{ now.getHours() < 12 ? 'morning' : now.getHours() < 18 ? 'afternoon' : 'evening' }}, {{ currentUser?.firstName }}</h1>
        <p class="lede">Live overview for {{ formatLongDateLabel(today) }}.</p>
      </div>
      <NuxtLink to="/hr/attendance" class="btn btn-soft">
        Today's attendance
        <AppIcon name="arrow-right" />
      </NuxtLink>
    </header>

    <div class="stat-grid stagger">
      <div class="reveal-delay-1"><StatCard label="Clocked in today" :value="todayStats.clockedIn" icon="clock" tone="aqua" hint="time-ins recorded" /></div>
      <div class="reveal-delay-2"><StatCard label="Late today" :value="todayStats.late" icon="info" tone="peach" hint="past grace period" /></div>
      <div class="reveal-delay-3"><StatCard label="Absent today" :value="todayStats.absent" icon="user" tone="blush" hint="no record, working day" /></div>
      <div class="reveal-delay-4"><StatCard label="On leave today" :value="todayStats.onLeave" icon="leaf" tone="lavender" hint="approved leave" /></div>
      <div class="reveal-delay-4"><StatCard label="Pending leaves" :value="todayStats.pending" icon="plus" tone="mint" hint="waiting for review" /></div>
    </div>

    <div class="hr-overview-grid">
      <section class="glass panel v-reveal is-visible" aria-labelledby="today-title">
        <div class="panel-head">
          <h2 id="today-title" class="section-title">Today's attendance</h2>
          <span class="muted">{{ todayStats.rows.filter((row) => row.record?.timeIn).length }} of {{ todayStats.rows.length }} in</span>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th scope="col">Employee</th>
                <th scope="col">Time In</th>
                <th scope="col">Time Out</th>
                <th scope="col">Hours</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in todayStats.rows" :key="row.employee.id">
                <td>
                  <span class="cell-strong">{{ employeeLabel(row.employee) }}</span>
                  <span class="cell-sub">{{ row.employee.jobTitle || row.employee.role }}</span>
                </td>
                <td>{{ formatClockTime(row.record?.timeIn) }}</td>
                <td>{{ formatClockTime(row.record?.timeOut) }}</td>
                <td>{{ row.hours != null ? `${row.hours.toFixed(2)}` : '—' }}</td>
                <td><StatusBadge :status="row.status" /></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="!todayStats.rows.length" class="empty-state">
          <span class="icon"><AppIcon name="users" /></span>
          <p>No active employees yet.</p>
        </div>
      </section>

      <section class="glass panel v-reveal is-visible" aria-labelledby="pending-title">
        <div class="panel-head">
          <h2 id="pending-title" class="section-title">Pending leave requests</h2>
          <span class="status-badge is-pending">{{ pendingRequests.length }} pending</span>
        </div>

        <ul class="pending-list">
          <li v-for="request in pendingRequests" :key="request.id" class="pending-item">
            <div class="pending-top">
              <span class="cell-strong">{{ employeeLabel(memberById(request.employeeId)) }}</span>
              <span class="muted">{{ request.workingDays }} day{{ request.workingDays === 1 ? '' : 's' }}</span>
            </div>
            <p class="cell-sub">
              {{ leaveTypes.find((type) => type.id === request.typeId)?.name }} ·
              {{ request.startDate }} → {{ request.endDate }}
              <span v-if="request.halfDay"> · half day</span>
            </p>
            <p class="pending-reason">{{ request.reason }}</p>
            <div class="pending-actions">
              <button type="button" class="btn btn-primary btn-sm" @click="quickApprove(request.id)">
                <AppIcon name="check" />
                Approve
              </button>
              <button type="button" class="btn btn-outline btn-sm" @click="openReject(request.id)">
                Reject
              </button>
              <span class="muted">{{ formatStamp(request.createdAt) }}</span>
            </div>
          </li>
        </ul>

        <div v-if="!pendingRequests.length" class="empty-state">
          <span class="icon"><AppIcon name="check" /></span>
          <p>All caught up — no pending leave requests.</p>
        </div>
      </section>

      <section class="glass panel v-reveal is-visible" aria-labelledby="cal-title">
        <div class="panel-head">
          <h2 id="cal-title" class="section-title">Calendar</h2>
          <span class="muted">Holidays & approved leaves</span>
        </div>
        <MiniCalendar :marks="marks" />
      </section>
    </div>

    <AppModal
      :open="Boolean(rejectTarget)"
      title="Reject leave request"
      subtitle="A comment is required — the employee will see it."
      @update:open="rejectTarget = null"
    >
      <div class="field">
        <label for="reject-comment">Comment</label>
        <textarea
          id="reject-comment"
          v-model="rejectComment"
          rows="3"
          placeholder="Coverage is already short that week — please pick another date."
        />
      </div>
      <template #footer>
        <button type="button" class="btn btn-ghost" @click="rejectTarget = null">Cancel</button>
        <button type="button" class="btn btn-danger" :disabled="!rejectComment.trim()" @click="confirmReject">
          Reject request
        </button>
      </template>
    </AppModal>
  </div>
</template>
