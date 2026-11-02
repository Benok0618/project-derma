export interface DayInfo {
  date: Date
  iso: string
  day: number
  inMonth: boolean
  isPast: boolean
  isSunday: boolean
  isClosed: boolean
  isFull: boolean
  available: boolean
}

export interface TimeSlot {
  time: string
  label: string
  taken: boolean
}

export interface BookedSlot {
  date: string
  time: string
}

const BASE_HOURS = [9, 10, 11, 13, 14, 15, 16]
const CLOSED_DAY_OF_MONTH = [3, 24]

export function toIso(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function fromIso(iso: string): Date {
  const parts = iso.split('-').map(Number)
  return new Date(parts[0]!, parts[1]! - 1, parts[2]!)
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function isClosedDate(date: Date): boolean {
  return CLOSED_DAY_OF_MONTH.includes(date.getDate())
}

/** Every hourly slot the studio can serve on one day. */
export function slotCount(): number {
  return BASE_HOURS.length
}

/** Times already reserved on a given date, from confirmed bookings. */
export function bookedTimesFor(booked: BookedSlot[], iso: string): string[] {
  return booked.filter((slot) => slot.date === iso).map((slot) => slot.time)
}

/** Dates where every slot is taken, so the day can no longer be picked. */
export function fullyBookedDates(booked: BookedSlot[]): Set<string> {
  const counts = new Map<string, number>()
  for (const slot of booked) {
    counts.set(slot.date, (counts.get(slot.date) ?? 0) + 1)
  }
  const full = new Set<string>()
  for (const [date, count] of counts) {
    if (count >= BASE_HOURS.length) full.add(date)
  }
  return full
}

export function isDateAvailable(date: Date, today = new Date(), fullDates?: Set<string>): boolean {
  const day = startOfDay(date)
  if (day.getTime() < startOfDay(today).getTime()) return false
  if (date.getDay() === 0) return false
  if (isClosedDate(date)) return false
  if (fullDates?.has(toIso(date))) return false
  return true
}

export function buildMonth(
  viewYear: number,
  viewMonth: number,
  today = new Date(),
  fullDates: Set<string> = new Set(),
): DayInfo[] {
  const first = new Date(viewYear, viewMonth, 1)
  const startOffset = first.getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells: DayInfo[] = []

  for (let i = 0; i < startOffset; i++) {
    const date = new Date(viewYear, viewMonth, i - startOffset + 1)
    cells.push(describe(date, false, today, fullDates))
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(describe(new Date(viewYear, viewMonth, d), true, today, fullDates))
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1]!.date
    cells.push(describe(new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), false, today, fullDates))
  }
  return cells
}

function describe(date: Date, inMonth: boolean, today: Date, fullDates: Set<string>): DayInfo {
  const past = startOfDay(date).getTime() < startOfDay(today).getTime()
  const sunday = date.getDay() === 0
  const closed = isClosedDate(date)
  const full = fullDates.has(toIso(date))
  return {
    date,
    iso: toIso(date),
    day: date.getDate(),
    inMonth,
    isPast: past,
    isSunday: sunday,
    isClosed: closed,
    isFull: full,
    available: inMonth && !past && !sunday && !closed && !full,
  }
}

function label(hour: number): string {
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const display = hour % 12 === 0 ? 12 : hour % 12
  return `${display}:00 ${suffix}`
}

/**
 * Slots for one date. A slot is taken when a confirmed booking already holds it.
 * Once every slot is held, `fullyBookedDates` closes the whole day.
 */
export function slotsForDate(iso: string, bookedTimes: string[] = []): TimeSlot[] {
  const booked = new Set(bookedTimes)
  return BASE_HOURS.map((hour) => {
    const time = `${String(hour).padStart(2, '0')}:00`
    return { time, label: label(hour), taken: booked.has(time) }
  })
}

export function monthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export function weekdayLabels(): string[] {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
}

export function longDate(iso: string): string {
  return fromIso(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}
