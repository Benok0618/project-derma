import type { TimeRecord } from '~/types'
import { fromIso, toIso } from '~/utils/calendar'

export const SHIFT_START_MINUTES = 9 * 60
export const GRACE_MINUTES = 10

export type AttendanceStatus = 'On Time' | 'Late' | 'Absent' | 'Still Clocked In'

export function isoDate(date = new Date()): string {
  return toIso(date)
}

export function addDays(dateIso: string, days: number): string {
  const date = fromIso(dateIso)
  date.setDate(date.getDate() + days)
  return toIso(date)
}

export function minutesOfDay(value: string | Date): number {
  const date = typeof value === 'string' ? new Date(value) : value
  return date.getHours() * 60 + date.getMinutes()
}

export function formatClock(value: string | null | undefined): string {
  if (!value) return '—'
  return new Date(value).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export function formatDateLabel(dateIso: string): string {
  return fromIso(dateIso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function formatLongDateLabel(dateIso: string): string {
  return fromIso(dateIso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatStamp(value: string): string {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function relativeFrom(value: string): string {
  const diff = Date.now() - new Date(value).getTime()
  const minutes = Math.round(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.round(hours / 24)
  return days === 1 ? 'yesterday' : `${days} days ago`
}

export function isLate(record?: TimeRecord | null): boolean {
  if (!record?.timeIn) return false
  return minutesOfDay(record.timeIn) > SHIFT_START_MINUTES + GRACE_MINUTES
}

export function attendanceStatus(record?: TimeRecord | null): AttendanceStatus {
  if (!record?.timeIn) return 'Absent'
  if (isLate(record)) return 'Late'
  if (!record.timeOut) return 'Still Clocked In'
  return 'On Time'
}

export function workedHours(record?: TimeRecord | null): number | null {
  if (!record?.timeIn || !record.timeOut) return null
  return (new Date(record.timeOut).getTime() - new Date(record.timeIn).getTime()) / 3600000
}

export function formatHours(hours: number | null): string {
  if (hours == null) return '—'
  const whole = Math.floor(hours)
  const minutes = Math.round((hours - whole) * 60)
  return `${whole}h ${String(minutes).padStart(2, '0')}m`
}

export function greeting(date = new Date()): string {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}
