import type { Holiday, HrSettings, LeaveRequest, LeaveType, StaffAccount, TimeRecord } from '~/types'
import { fromIso, toIso } from '~/utils/calendar'

export type HrStatus = 'On Time' | 'Late' | 'Absent' | 'Still Clocked In' | 'On Leave' | 'Day Off'

export const STATUS_FILTERS: HrStatus[] = [
  'On Time',
  'Late',
  'Absent',
  'On Leave',
  'Still Clocked In',
]

export function hhmmToMinutes(value: string): number {
  const [hour = '0', minute = '0'] = value.split(':')
  return Number(hour) * 60 + Number(minute)
}

export function minutesToHhmm(minutes: number): string {
  const safe = Math.max(0, Math.min(24 * 60 - 1, Math.round(minutes)))
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`
}

export function formatHhmm(value: string | null | undefined): string {
  if (!value) return '—'
  const total = hhmmToMinutes(value)
  const suffix = total >= 12 * 60 ? 'PM' : 'AM'
  const display = Math.floor(total / 60) % 12 === 0 ? 12 : Math.floor(total / 60) % 12
  return `${display}:${String(total % 60).padStart(2, '0')} ${suffix}`
}

export function formatClockTime(value: string | null | undefined): string {
  if (!value) return '—'
  return new Date(value).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export function holidayFor(dateIso: string, holidays: Holiday[]): Holiday | undefined {
  return holidays.find((holiday) => holiday.date === dateIso)
}

export function isWorkingDate(dateIso: string, settings: HrSettings, holidays: Holiday[]): boolean {
  if (!settings.workingDays.includes(fromIso(dateIso).getDay())) return false
  return !holidayFor(dateIso, holidays)
}

export function isLeaveDate(dateIso: string, staffId: string, requests: LeaveRequest[]): boolean {
  return requests.some(
    (request) =>
      request.status === 'Approved' &&
      request.employeeId === staffId &&
      dateIso >= request.startDate &&
      dateIso <= request.endDate,
  )
}

export function lateMinutesOf(record: TimeRecord | null | undefined, settings: HrSettings): number {
  if (!record?.timeIn) return 0
  const arrival = new Date(record.timeIn).getHours() * 60 + new Date(record.timeIn).getMinutes()
  const cutoff = hhmmToMinutes(settings.shiftStart) + settings.graceMinutes
  if (arrival <= cutoff) return 0
  return arrival - hhmmToMinutes(settings.shiftStart)
}

export function hoursOf(record: TimeRecord | null | undefined): number | null {
  if (!record?.timeIn || !record.timeOut) return null
  const ms = new Date(record.timeOut).getTime() - new Date(record.timeIn).getTime()
  return Math.max(0, ms / 3600000)
}

export function formatDecimalHours(hours: number | null | undefined): string {
  if (hours == null) return '—'
  return hours.toFixed(2).replace(/\.00$/, '.00')
}

export function statusForDay(
  dateIso: string,
  record: TimeRecord | null | undefined,
  onLeave: boolean,
  settings: HrSettings,
  holidays: Holiday[],
): HrStatus {
  if (onLeave) return 'On Leave'
  if (!record?.timeIn) {
    return isWorkingDate(dateIso, settings, holidays) ? 'Absent' : 'Day Off'
  }
  if (lateMinutesOf(record, settings) > 0) return 'Late'
  if (!record.timeOut) return 'Still Clocked In'
  return 'On Time'
}

export function countWorkingDays(
  startDate: string,
  endDate: string,
  halfDay: boolean,
  settings: HrSettings,
  holidays: Holiday[],
): number {
  if (!startDate || !endDate || endDate < startDate) return 0
  let count = 0
  let cursor = fromIso(startDate)
  const last = fromIso(endDate)
  let guard = 0
  while (cursor.getTime() <= last.getTime() && guard < 800) {
    if (isWorkingDate(toIso(cursor), settings, holidays)) count += 1
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1)
    guard += 1
  }
  if (count > 0 && halfDay) count -= 0.5
  return Math.max(0, count)
}

export function overlapsAnyRange(
  startDate: string,
  endDate: string,
  requests: LeaveRequest[],
  excludeId?: string,
): boolean {
  return requests.some(
    (request) =>
      request.id !== excludeId &&
      (request.status === 'Pending' || request.status === 'Approved') &&
      request.startDate <= endDate &&
      request.endDate >= startDate,
  )
}

export function monthDateList(year: number, month: number): string[] {
  const days = new Date(year, month + 1, 0).getDate()
  const list: string[] = []
  for (let day = 1; day <= days; day++) list.push(toIso(new Date(year, month, day)))
  return list
}

export function monthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export function monthShortLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export function validPhilippineMobile(value: string): boolean {
  const digits = value.replace(/[\s()-]/g, '')
  return /^09\d{9}$/.test(digits) || /^\+639\d{9}$/.test(digits)
}

export function normalizeMobile(value: string): string {
  const digits = value.replace(/[\s()-]/g, '')
  if (digits.startsWith('+639')) return `0${digits.slice(3)}`
  return digits
}

export function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const radius = 6371000
  const toRad = (value: number) => (value * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * radius * Math.asin(Math.sqrt(a))
}

export function csvDownload(filename: string, rows: Array<Array<string | number>>): void {
  const body = rows
    .map((row) =>
      row
        .map((cell) => {
          const text = String(cell ?? '')
          return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
        })
        .join(','),
    )
    .join('\n')
  const blob = new Blob([`﻿${body}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function leaveTypeById(types: LeaveType[], id: string): LeaveType | undefined {
  return types.find((type) => type.id === id)
}

export function employeeLabel(member: StaffAccount | undefined | null): string {
  return member ? `${member.firstName} ${member.lastName}` : 'Unknown'
}
