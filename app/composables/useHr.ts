import { computed } from 'vue'
import type { LeaveRequest, LeaveType, StaffAccount, TimeRecord } from '~/types'
import { useAuth } from '~/composables/useAuth'
import { useStore } from '~/composables/useStore'
import { addDays, isoDate } from '~/utils/datetime'
import { fromIso } from '~/utils/calendar'
import {
  countWorkingDays,
  employeeLabel,
  formatClockTime,
  holidayFor,
  hoursOf,
  isLeaveDate,
  isWorkingDate,
  lateMinutesOf,
  monthDateList,
  overlapsAnyRange,
  statusForDay,
} from '~/utils/hr'
import type { HrStatus } from '~/utils/hr'

export interface AttendanceRow {
  employee: StaffAccount
  record: TimeRecord | null
  status: HrStatus
  lateMinutes: number
  hours: number | null
  leaveTypeName: string
}

export interface BalanceInfo {
  type: LeaveType
  credits: number
  used: number
  remaining: number
  unlimited: boolean
}

export interface DtrDay {
  date: string
  dayNumber: number
  weekdayLabel: string
  timeIn: string | null
  timeOut: string | null
  hours: number | null
  late: number
  remark: string
}

export interface DtrTotals {
  daysPresent: number
  totalHours: number
  totalLate: number
  daysOnLeave: number
  daysAbsent: number
}

export interface MonthSummary {
  daysPresent: number
  lateCount: number
  lateMinutes: number
  absences: number
  leaves: number
  totalHours: number
}

const STATUS_ORDER: HrStatus[] = [
  'On Leave',
  'Late',
  'Still Clocked In',
  'On Time',
  'Absent',
  'Day Off',
]

export function useHr() {
  const store = useStore()
  const { currentUser } = useAuth()

  const settings = computed(() => store.state.value.hrSettings)
  const holidays = computed(() => store.state.value.holidays)
  const leaveTypes = computed(() => store.state.value.leaveTypes)
  const leaveRequests = computed(() => store.state.value.leaveRequests)
  const auditLog = computed(() => store.state.value.auditLog)
  const employees = computed(() => store.state.value.staff)
  const activeEmployees = computed(() => employees.value.filter((member) => member.active))

  const pendingRequests = computed(() =>
    leaveRequests.value
      .filter((request) => request.status === 'Pending')
      .sort((a, b) => (a.startDate < b.startDate ? -1 : 1)),
  )

  const meName = computed(
    () => (currentUser.value ? employeeLabel(currentUser.value) : 'System') || 'System',
  )

  function memberById(id: string): StaffAccount | undefined {
    return store.staffById(id)
  }

  function holidayOn(dateIso: string) {
    return holidayFor(dateIso, holidays.value)
  }

  function leaveOn(dateIso: string, staffId: string): LeaveRequest | undefined {
    return leaveRequests.value.find(
      (request) =>
        request.status === 'Approved' &&
        request.employeeId === staffId &&
        dateIso >= request.startDate &&
        dateIso <= request.endDate,
    )
  }

  function recordOf(staffId: string, dateIso: string): TimeRecord | null {
    return store.recordFor(staffId, dateIso) ?? null
  }

  function statusOf(staffId: string, dateIso: string): HrStatus {
    const record = recordOf(staffId, dateIso)
    const onLeave = isLeaveDate(dateIso, staffId, leaveRequests.value)
    if (!record?.timeIn) {
      if (!isWorkingDate(dateIso, settings.value, holidays.value)) return 'Day Off'
      if (onLeave) return 'On Leave'
      return 'Absent'
    }
    if (lateMinutesOf(record, settings.value) > 0) return 'Late'
    if (!record.timeOut) return 'Still Clocked In'
    return 'On Time'
  }

  function rowsFor(dateIso: string): AttendanceRow[] {
    return activeEmployees.value
      .map((employee) => {
        const record = recordOf(employee.id, dateIso)
        const leave = leaveOn(dateIso, employee.id)
        const leaveType = leave ? leaveTypes.value.find((type) => type.id === leave.typeId) : null
        return {
          employee,
          record,
          status: statusOf(employee.id, dateIso),
          lateMinutes: lateMinutesOf(record, settings.value),
          hours: hoursOf(record),
          leaveTypeName: leaveType?.name ?? '',
        }
      })
      .sort((a, b) => {
        const diff = STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)
        if (diff !== 0) return diff
        return employeeLabel(a.employee).localeCompare(employeeLabel(b.employee))
      })
  }

  function balanceOf(staffId: string, type: LeaveType): BalanceInfo {
    const approved = leaveRequests.value.filter(
      (request) =>
        request.employeeId === staffId &&
        request.typeId === type.id &&
        request.status === 'Approved',
    )
    const used = approved.reduce((sum, request) => sum + request.workingDays, 0)
    const delta = store.state.value.leaveAdjustments
      .filter(
        (adjustment) => adjustment.employeeId === staffId && adjustment.typeId === type.id,
      )
      .reduce((sum, adjustment) => sum + adjustment.delta, 0)
    const remaining = type.yearlyCredits + delta - used
    return {
      type,
      credits: type.yearlyCredits,
      used,
      remaining,
      unlimited: !type.paid,
    }
  }

  function balancesFor(staffId: string): BalanceInfo[] {
    return leaveTypes.value
      .filter((type) => type.active)
      .map((type) => balanceOf(staffId, type))
  }

  function workingDaysBetween(startDate: string, endDate: string, halfDay: boolean): number {
    return countWorkingDays(startDate, endDate, halfDay, settings.value, holidays.value)
  }

  function fileLeave(input: {
    employeeId: string
    typeId: string
    startDate: string
    endDate: string
    halfDay: boolean
    reason: string
  }): { ok: boolean; error?: string } {
    const type = leaveTypes.value.find((entry) => entry.id === input.typeId)
    if (!type) return { ok: false, error: 'Choose a leave type.' }
    if (!input.startDate || !input.endDate) return { ok: false, error: 'Choose both dates.' }
    if (input.endDate < input.startDate)
      return { ok: false, error: 'The end date must be on or after the start date.' }
    if (!input.reason.trim()) return { ok: false, error: 'Tell HR the reason for your leave.' }
    const days = workingDaysBetween(input.startDate, input.endDate, input.halfDay)
    if (days <= 0)
      return {
        ok: false,
        error: 'That range has no working days — Sundays and holidays are excluded.',
      }
    if (overlapsAnyRange(input.startDate, input.endDate, leaveRequests.value))
      return {
        ok: false,
        error: 'These dates overlap an existing pending or approved leave.',
      }
    const balance = balanceOf(input.employeeId, type)
    if (!balance.unlimited && days > balance.remaining)
      return {
        ok: false,
        error: `This request needs ${days} day${days === 1 ? '' : 's'} but only ${balance.remaining} remain on ${type.name}.`,
      }
    store.addLeaveRequest({ ...input, workingDays: days, status: 'Pending' })
    return { ok: true }
  }

  function approveRequest(request: LeaveRequest): { ok: boolean; error?: string } {
    const type = leaveTypes.value.find((entry) => entry.id === request.typeId)
    if (type) {
      const balance = balanceOf(request.employeeId, type)
      if (!balance.unlimited && request.workingDays > balance.remaining)
        return {
          ok: false,
          error: `Not enough ${type.name} credits left — ${request.workingDays} needed, ${balance.remaining} remaining.`,
        }
    }
    store.updateLeaveRequest(request.id, {
      status: 'Approved',
      decidedBy: meName.value,
      decidedAt: new Date().toISOString(),
      comment: request.comment ?? '',
    })
    return { ok: true }
  }

  function rejectRequest(request: LeaveRequest, comment: string): { ok: boolean; error?: string } {
    if (!comment.trim()) return { ok: false, error: 'A rejection comment is required.' }
    store.updateLeaveRequest(request.id, {
      status: 'Rejected',
      comment: comment.trim(),
      decidedBy: meName.value,
      decidedAt: new Date().toISOString(),
    })
    return { ok: true }
  }

  function cancelRequest(request: LeaveRequest): void {
    store.updateLeaveRequest(request.id, {
      status: 'Cancelled',
      decidedAt: new Date().toISOString(),
    })
  }

  function adjustBalance(
    staffId: string,
    type: LeaveType,
    delta: number,
    reason: string,
  ): { ok: boolean; error?: string } {
    if (!reason.trim()) return { ok: false, error: 'A reason is required for adjustments.' }
    if (!delta) return { ok: false, error: 'Enter a non-zero credit change.' }
    const before = balanceOf(staffId, type)
    store.addAdjustment({ employeeId: staffId, typeId: type.id, delta, reason: reason.trim(), by: meName.value })
    const after = balanceOf(staffId, type)
    store.addAudit({
      by: meName.value,
      action: 'Balance adjustment',
      employeeId: staffId,
      employeeName: employeeLabel(memberById(staffId)),
      reason: reason.trim(),
      before: `${type.name} remaining: ${before.remaining}`,
      after: `${type.name} remaining: ${after.remaining}`,
    })
    return { ok: true }
  }

  function isoAt(dateIso: string, hhmm: string): string | null {
    if (!hhmm) return null
    const [hour, minute] = hhmm.split(':').map(Number)
    const date = fromIso(dateIso)
    date.setHours(hour ?? 0, minute ?? 0, 0, 0)
    return date.toISOString()
  }

  function toHhmm(value: string | null | undefined): string {
    if (!value) return ''
    const date = new Date(value)
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  function saveCorrection(input: {
    employeeId: string
    date: string
    timeIn: string
    timeOut: string
    reason: string
    isNew: boolean
  }): { ok: boolean; error?: string } {
    if (!input.reason.trim()) return { ok: false, error: 'A reason is required.' }
    if (input.timeIn && input.timeOut && input.timeOut < input.timeIn)
      return { ok: false, error: 'Time out must be after time in.' }
    const record = store.ensureRecord(input.employeeId, input.date)
    const before = `Time In ${formatClockTime(record.timeIn)} · Time Out ${formatClockTime(record.timeOut)}`
    record.timeIn = isoAt(input.date, input.timeIn)
    record.timeOut = isoAt(input.date, input.timeOut)
    record.edited = true
    record.editReason = input.reason.trim()
    const after = `Time In ${formatClockTime(record.timeIn)} · Time Out ${formatClockTime(record.timeOut)}`
    store.addAudit({
      by: meName.value,
      action: input.isNew ? 'Missing record added' : 'Attendance correction',
      employeeId: input.employeeId,
      employeeName: employeeLabel(memberById(input.employeeId)),
      reason: input.reason.trim(),
      before,
      after,
    })
    return { ok: true }
  }

  function dtrFor(staffId: string, year: number, month: number) {
    const days: DtrDay[] = []
    const totals: DtrTotals = { daysPresent: 0, totalHours: 0, totalLate: 0, daysOnLeave: 0, daysAbsent: 0 }
    const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    for (const dateIso of monthDateList(year, month)) {
      const date = fromIso(dateIso)
      const record = recordOf(staffId, dateIso)
      const holiday = holidayOn(dateIso)
      const leave = leaveOn(dateIso, staffId)
      const leaveType = leave ? leaveTypes.value.find((type) => type.id === leave.typeId) : null
      const hours = hoursOf(record)
      const late = lateMinutesOf(record, settings.value)
      const working = isWorkingDate(dateIso, settings.value, holidays.value)

      let remark = 'Present'
      if (holiday) remark = holiday.name
      else if (!settings.value.workingDays.includes(date.getDay())) remark = date.getDay() === 0 ? 'Sunday' : 'Day Off'
      else if (leave) remark = `On Leave${leaveType ? ` (${leaveType.name})` : ''}`
      else if (!record?.timeIn) remark = 'Absent'
      else if (!record.timeOut) remark = 'Incomplete'
      else if (late > 0) remark = 'Late'

      if (record?.timeIn) {
        totals.daysPresent += 1
        totals.totalLate += late
        if (hours) totals.totalHours += hours
      } else if (leave && working) {
        totals.daysOnLeave += 1
      } else if (working) {
        totals.daysAbsent += 1
      }

      days.push({
        date: dateIso,
        dayNumber: date.getDate(),
        weekdayLabel: weekdayLabels[date.getDay()] ?? '',
        timeIn: record?.timeIn ?? null,
        timeOut: record?.timeOut ?? null,
        hours,
        late,
        remark,
      })
    }

    return { days, totals }
  }

  function summaryFor(staffId: string, year: number, month: number): MonthSummary {
    const { days, totals } = dtrFor(staffId, year, month)
    return {
      daysPresent: totals.daysPresent,
      lateCount: days.filter((day) => day.late > 0 && day.remark !== 'Absent').length,
      lateMinutes: totals.totalLate,
      absences: totals.daysAbsent,
      leaves: totals.daysOnLeave,
      totalHours: totals.totalHours,
    }
  }

  const todayStats = computed(() => {
    const today = isoDate()
    const rows = rowsFor(today)
    return {
      clockedIn: rows.filter((row) => row.record?.timeIn).length,
      late: rows.filter((row) => row.status === 'Late').length,
      absent: rows.filter((row) => row.status === 'Absent').length,
      onLeave: rows.filter((row) => row.status === 'On Leave').length,
      pending: pendingRequests.value.length,
      rows,
    }
  })

  function upcomingLeaveDays(count: number): Array<{ date: string; name: string }> {
    const today = isoDate()
    const marks: Array<{ date: string; name: string }> = []
    for (let offset = 0; offset < count; offset++) {
      const date = addDays(today, offset)
      const holiday = holidayOn(date)
      if (holiday) marks.push({ date, name: holiday.name })
    }
    return marks
  }

  return {
    settings,
    holidays,
    leaveTypes,
    leaveRequests,
    auditLog,
    employees,
    activeEmployees,
    pendingRequests,
    memberById,
    holidayOn,
    leaveOn,
    recordOf,
    statusOf,
    rowsFor,
    balanceOf,
    balancesFor,
    workingDaysBetween,
    fileLeave,
    approveRequest,
    rejectRequest,
    cancelRequest,
    adjustBalance,
    saveCorrection,
    toHhmm,
    dtrFor,
    summaryFor,
    todayStats,
    upcomingLeaveDays,
  }
}

export function employeeMonthKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const date = new Date(year, month + delta, 1)
  return { year: date.getFullYear(), month: date.getMonth() }
}
