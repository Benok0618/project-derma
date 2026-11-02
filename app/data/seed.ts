import type {
  AuditEntry,
  Doctor,
  Holiday,
  HrSettings,
  Inquiry,
  LeaveAdjustment,
  LeaveRequest,
  LeaveType,
  PromoDiscount,
  StaffAccount,
  TimeRecord,
} from '~/types'
import { services } from '~/data/services'
import { fromIso } from '~/utils/calendar'
import { addDays, isoDate } from '~/utils/datetime'
import { countWorkingDays } from '~/utils/hr'

export const seedServices = services

export const demoAccounts = [
  { role: 'HR Admin', email: 'hr@lumiderma.example', password: 'demo1234' },
  { role: 'Front Desk', email: 'frontdesk@lumiderma.example', password: 'demo1234' },
  { role: 'Facialist', email: 'facialist@lumiderma.example', password: 'demo1234' },
]

export const demoPassword = 'demo1234'

export const seedStaff: StaffAccount[] = [
  {
    id: 'stf-rina',
    firstName: 'Rina',
    lastName: 'Domingo',
    email: 'hr@lumiderma.example',
    mobile: '0917 100 0001',
    role: 'HR Admin',
    jobTitle: 'HR Manager',
    dateHired: '2024-01-08',
    password: demoPassword,
    active: true,
    createdAt: '2024-01-08T09:00:00.000Z',
  },
  {
    id: 'stf-miguel',
    firstName: 'Miguel',
    lastName: 'Tan',
    email: 'frontdesk@lumiderma.example',
    mobile: '0917 100 0002',
    role: 'Front Desk',
    jobTitle: 'Front Desk',
    dateHired: '2024-02-19',
    password: demoPassword,
    active: true,
    createdAt: '2024-02-19T09:00:00.000Z',
  },
  {
    id: 'stf-joy',
    firstName: 'Joy',
    lastName: 'Ramirez',
    email: 'facialist@lumiderma.example',
    mobile: '0917 100 0003',
    role: 'Facialist',
    jobTitle: 'Facialist',
    dateHired: '2024-03-04',
    password: demoPassword,
    active: true,
    createdAt: '2024-03-04T09:00:00.000Z',
  },
  {
    id: 'stf-bea',
    firstName: 'Bea',
    lastName: 'Santos',
    email: 'bea.santos@lumiderma.example',
    mobile: '0917 100 0004',
    role: 'Facialist',
    jobTitle: 'Facialist',
    dateHired: '2024-06-11',
    password: demoPassword,
    active: true,
    createdAt: '2024-06-11T09:00:00.000Z',
  },
  {
    id: 'stf-paolo',
    firstName: 'Paolo',
    lastName: 'Cruz',
    email: 'paolo.cruz@lumiderma.example',
    mobile: '0917 100 0005',
    role: 'Front Desk',
    jobTitle: 'Receptionist',
    dateHired: '2024-09-02',
    password: demoPassword,
    active: true,
    createdAt: '2024-09-02T09:00:00.000Z',
  },
  {
    id: 'stf-nadine',
    firstName: 'Nadine',
    lastName: 'Reyes',
    email: 'nadine.reyes@lumiderma.example',
    mobile: '0917 100 0006',
    role: 'Facialist',
    jobTitle: 'Senior Facialist',
    dateHired: '2025-01-15',
    password: demoPassword,
    active: true,
    createdAt: '2025-01-15T09:00:00.000Z',
  },
]

export const seedPromos: PromoDiscount[] = [
  {
    id: 'promo-1',
    name: 'Welcome Glow',
    description: 'First-time patient discount on any facial treatment',
    type: 'percentage',
    value: 20,
    code: 'WELCOME20',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    applicableServices: ['hydrafacial', 'chemical-peel', 'brightening-facial'],
    minPurchase: 1000,
    maxDiscount: 1500,
    active: true,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'promo-2',
    name: 'Acne Care Package',
    description: 'Bundle discount for acne treatment series',
    type: 'fixed',
    value: 1500,
    code: 'ACNE1500',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    applicableServices: ['acne-treatment', 'acne-scar-microneedling'],
    minPurchase: 3000,
    maxDiscount: null,
    active: true,
    createdAt: '2025-01-15T00:00:00.000Z',
  },
  {
    id: 'promo-3',
    name: 'Laser Loyalty',
    description: 'Repeat customer discount on laser treatments',
    type: 'percentage',
    value: 15,
    code: 'LASER15',
    startDate: '2025-02-01',
    endDate: '2025-12-31',
    applicableServices: ['laser-hair-removal', 'pigmentation-laser', 'carbon-laser-facial'],
    minPurchase: 4000,
    maxDiscount: 2000,
    active: true,
    createdAt: '2025-02-01T00:00:00.000Z',
  },
  {
    id: 'promo-4',
    name: 'Anti-Aging Essentials',
    description: 'Fixed discount on Botox and Fillers combo',
    type: 'fixed',
    value: 2000,
    code: 'AGELESS2000',
    startDate: '2025-03-01',
    endDate: '2025-11-30',
    applicableServices: ['botox', 'dermal-fillers', 'skin-boosters'],
    minPurchase: 10000,
    maxDiscount: null,
    active: false,
    createdAt: '2025-03-01T00:00:00.000Z',
  },
  {
    id: 'promo-5',
    name: 'Student Glow Up',
    description: 'Special student discount with valid ID',
    type: 'percentage',
    value: 10,
    code: 'STUDENT10',
    startDate: '2025-06-01',
    endDate: '2025-12-31',
    applicableServices: ['skin-consultation', 'hydrafacial', 'chemical-peel', 'brightening-facial'],
    minPurchase: 500,
    maxDiscount: 800,
    active: true,
    createdAt: '2025-06-01T00:00:00.000Z',
  },
]

export const seedDoctors: Doctor[] = [
  {
    id: 'doc-1',
    firstName: 'Dr. Maria',
    lastName: 'Santos-Reyes',
    email: 'dra.maria.santos@lumiderma.example',
    mobile: '0917 200 0001',
    specialty: 'Dermatology & Cosmetic Surgery',
    licenseNumber: 'MD-2015-004521',
    active: true,
    createdAt: '2024-01-15T09:00:00.000Z',
  },
  {
    id: 'doc-2',
    firstName: 'Dr. Antonio',
    lastName: 'Delgado',
    email: 'dr.antonio.delgado@lumiderma.example',
    mobile: '0917 200 0002',
    specialty: 'Clinical Dermatology',
    licenseNumber: 'MD-2018-007834',
    active: true,
    createdAt: '2024-03-22T09:00:00.000Z',
  },
  {
    id: 'doc-3',
    firstName: 'Dr. Catherine',
    lastName: 'Lim-Ong',
    email: 'dra.catherine.lim@lumiderma.example',
    mobile: '0917 200 0003',
    specialty: 'Pediatric Dermatology',
    licenseNumber: 'MD-2019-011203',
    active: true,
    createdAt: '2024-07-10T09:00:00.000Z',
  },
  {
    id: 'doc-4',
    firstName: 'Dr. Rafael',
    lastName: 'Torres',
    email: 'dr.rafael.torres@lumiderma.example',
    mobile: '0917 200 0004',
    specialty: 'Dermatopathology & Laser Surgery',
    licenseNumber: 'MD-2020-014567',
    active: true,
    createdAt: '2025-01-20T09:00:00.000Z',
  },
  {
    id: 'doc-5',
    firstName: 'Dr. Patricia',
    lastName: 'Gonzales',
    email: 'dra.patricia.gonzales@lumiderma.example',
    mobile: '0917 200 0005',
    specialty: 'Aesthetic & Anti-Aging Medicine',
    licenseNumber: 'MD-2021-018902',
    active: false,
    createdAt: '2025-05-12T09:00:00.000Z',
  },
]

function hashOf(value: string): number {
  let hash = 2166136261
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function unit(seed: string): number {
  return (hashOf(seed) % 1000) / 1000
}

function atMinutes(dateIso: string, minutes: number): string {
  const date = fromIso(dateIso)
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)
  return date.toISOString()
}

const TODAY_PLAN: Array<{ in: number; out: number | null } | null> = [
  { in: 8 * 60 + 57, out: 12 * 60 + 30 },
  null,
  { in: 8 * 60 + 58, out: 17 * 60 + 20 },
  { in: 9 * 60 + 26, out: 17 * 60 + 45 },
  null,
  { in: 8 * 60 + 54, out: 17 * 60 + 30 },
]

function todayPlanFor(index: number): { in: number; out: number | null } | null {
  const plan = TODAY_PLAN[index]
  if (!plan) return null
  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  if (plan.in > nowMinutes) return null
  if (plan.out == null || plan.out > nowMinutes - 5) return { in: plan.in, out: null }
  return plan
}

function historyPlan(staffId: string, date: string): { in: number; out: number | null } | null {
  const roll = unit(`${staffId}:${date}`)
  if (roll < 0.1) return null
  const incomplete = roll > 0.962
  const late = roll > 0.74
  const inMinutes = late
    ? 9 * 60 + 12 + Math.floor(unit(`${staffId}:${date}:in`) * 28)
    : 8 * 60 + 47 + Math.floor(unit(`${staffId}:${date}:early`) * 11)
  const outMinutes = 17 * 60 + Math.floor(unit(`${staffId}:${date}:out`) * 26)
  return { in: inMinutes, out: incomplete ? null : outMinutes }
}

function avatarThumb(staff: StaffAccount, seedKey: string): string {
  const palette = ['#8fe3c4', '#f7c9d6', '#cbbfe9', '#f8d5a8', '#a7d8ee', '#f3b6c2']
  const fill = palette[Math.floor(unit(`${seedKey}:c`) * palette.length)] ?? '#8fe3c4'
  const initials = `${staff.firstName[0] ?? ''}${staff.lastName[0] ?? ''}`
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="46" fill="${fill}"/><text x="48" y="61" font-family="Arial, sans-serif" font-size="34" font-weight="700" text-anchor="middle" fill="#33202b" fill-opacity="0.72">${initials}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function seedWorkingDay(date: string): boolean {
  if (fromIso(date).getDay() === 0) return false
  return !seedHolidays.some((holiday) => holiday.date === date)
}

function approvedLeaveDayIndex(): Set<string> {
  const index = new Set<string>()
  for (const request of createSeedLeaveRequests()) {
    if (request.status !== 'Approved') continue
    let cursor = request.startDate
    let guard = 0
    while (cursor <= request.endDate && guard < 60) {
      index.add(`${request.employeeId}|${cursor}`)
      cursor = addDays(cursor, 1)
      guard += 1
    }
  }
  return index
}

export function createSeedTimeRecords(): TimeRecord[] {
  const records: TimeRecord[] = []
  const today = isoDate()
  const leaveDays = approvedLeaveDayIndex()

  for (let offset = 92; offset >= 0; offset--) {
    const date = addDays(today, -offset)
    if (!seedWorkingDay(date)) continue

    seedStaff.forEach((staff, index) => {
      if (leaveDays.has(`${staff.id}|${date}`)) return
      const plan = offset === 0 ? todayPlanFor(index) : historyPlan(staff.id, date)
      if (!plan) return
      const selfieKey = `${staff.id}:${date}:selfie`
      records.push({
        id: `tr-${staff.id}-${date}`,
        staffId: staff.id,
        date,
        timeIn: atMinutes(date, plan.in),
        timeOut: plan.out == null ? null : atMinutes(date, plan.out),
        selfie: unit(selfieKey) < 0.55 ? avatarThumb(staff, selfieKey) : null,
        locationVerified: unit(`${staff.id}:${date}:loc`) < 0.82,
      })
    })
  }

  return records
}

export const seedLeaveTypes: LeaveType[] = [
  { id: 'lt-vac', name: 'Vacation Leave', yearlyCredits: 15, paid: true, active: true },
  { id: 'lt-sick', name: 'Sick Leave', yearlyCredits: 10, paid: true, active: true },
  { id: 'lt-emg', name: 'Emergency Leave', yearlyCredits: 5, paid: true, active: true },
  { id: 'lt-unp', name: 'Unpaid Leave', yearlyCredits: 0, paid: false, active: true },
]

const HOLIDAY_YEAR = new Date().getFullYear()

export const seedHolidays: Holiday[] = [
  { id: 'hol-1', name: 'National Heroes Day', date: `${HOLIDAY_YEAR}-08-31`, type: 'Regular Holiday' },
  { id: 'hol-2', name: 'Lumi Derma Wellness Day', date: `${HOLIDAY_YEAR}-10-16`, type: 'Company Day Off' },
  { id: 'hol-3', name: "Clinic Founder's Day", date: `${HOLIDAY_YEAR}-10-24`, type: 'Company Day Off' },
  { id: 'hol-4', name: "All Saints' Day", date: `${HOLIDAY_YEAR}-11-01`, type: 'Special Non-Working Day' },
  { id: 'hol-5', name: 'Bonifacio Day', date: `${HOLIDAY_YEAR}-11-30`, type: 'Regular Holiday' },
  { id: 'hol-6', name: 'Christmas Day', date: `${HOLIDAY_YEAR}-12-25`, type: 'Regular Holiday' },
]

export const seedHrSettings: HrSettings = {
  shiftStart: '09:00',
  shiftEnd: '17:30',
  graceMinutes: 10,
  requiredHours: 8,
  workingDays: [1, 2, 3, 4, 5, 6],
  requireSelfie: true,
  requireLocation: true,
  latitude: 14.5547,
  longitude: 121.0244,
  radiusMeters: 150,
}

export function createSeedLeaveRequests(): LeaveRequest[] {
  const today = isoDate()
  const rows: Array<Omit<LeaveRequest, 'workingDays'>> = [
    {
      id: 'lr-1',
      employeeId: 'stf-joy',
      typeId: 'lt-vac',
      startDate: addDays(today, -38),
      endDate: addDays(today, -36),
      halfDay: false,
      reason: 'Family trip out of town, flights already booked.',
      status: 'Approved',
      decidedBy: 'Rina Domingo',
      decidedAt: new Date(Date.now() - 40 * 86400000).toISOString(),
      createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
    },
    {
      id: 'lr-2',
      employeeId: 'stf-miguel',
      typeId: 'lt-sick',
      startDate: addDays(today, -11),
      endDate: addDays(today, -10),
      halfDay: false,
      reason: 'Fever with a doctor certificate.',
      status: 'Approved',
      decidedBy: 'Rina Domingo',
      decidedAt: new Date(Date.now() - 12 * 86400000).toISOString(),
      createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    },
    {
      id: 'lr-3',
      employeeId: 'stf-bea',
      typeId: 'lt-vac',
      startDate: addDays(today, -63),
      endDate: addDays(today, -61),
      halfDay: false,
      reason: 'Out of the country vacation.',
      status: 'Approved',
      decidedBy: 'Rina Domingo',
      decidedAt: new Date(Date.now() - 66 * 86400000).toISOString(),
      createdAt: new Date(Date.now() - 70 * 86400000).toISOString(),
    },
    {
      id: 'lr-4',
      employeeId: 'stf-nadine',
      typeId: 'lt-vac',
      startDate: addDays(today, 7),
      endDate: addDays(today, 9),
      halfDay: false,
      reason: 'Family trip to Cebu, tickets already paid.',
      status: 'Pending',
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 'lr-5',
      employeeId: 'stf-paolo',
      typeId: 'lt-sick',
      startDate: addDays(today, 3),
      endDate: addDays(today, 3),
      halfDay: true,
      reason: 'Dental extraction in the morning, half day only.',
      status: 'Pending',
      createdAt: new Date(Date.now() - 20 * 3600000).toISOString(),
    },
    {
      id: 'lr-6',
      employeeId: 'stf-joy',
      typeId: 'lt-emg',
      startDate: addDays(today, -5),
      endDate: addDays(today, -4),
      halfDay: false,
      reason: 'Home repair needed on short notice.',
      status: 'Rejected',
      comment: 'Coverage was already short that week. Please pick another date.',
      decidedBy: 'Rina Domingo',
      decidedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    },
  ]

  return rows.map((row) => ({
    ...row,
    workingDays: countWorkingDays(
      row.startDate,
      row.endDate,
      row.halfDay,
      seedHrSettings,
      seedHolidays,
    ),
  }))
}

export const seedLeaveAdjustments: LeaveAdjustment[] = [
  {
    id: 'ladj-1',
    employeeId: 'stf-paolo',
    typeId: 'lt-sick',
    delta: 3,
    reason: 'Carried over unused credits from the last cycle.',
    by: 'Rina Domingo',
    at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
]

function clockLabel(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export function createSeedAuditLog(records: TimeRecord[]): AuditEntry[] {
  const entries: AuditEntry[] = []
  const target = records
    .filter((record) => record.staffId === 'stf-joy' && record.timeIn && record.date <= addDays(isoDate(), -7))
    .sort((a, b) => (a.date < b.date ? 1 : -1))[0]

  if (target?.timeIn) {
    const corrected = new Date(target.timeIn)
    const original = new Date(corrected.getTime() + 13 * 60000)
    const reason = 'Kiosk froze at arrival; arrival verified against the front desk log.'
    target.edited = true
    target.editReason = reason
    entries.push({
      id: 'aud-1',
      at: new Date(corrected.getTime() + 2 * 3600000).toISOString(),
      by: 'Rina Domingo',
      action: 'Attendance correction',
      employeeId: target.staffId,
      employeeName: 'Joy Ramirez',
      reason,
      before: `Time In ${clockLabel(original.toISOString())} · Time Out ${clockLabel(target.timeOut)}`,
      after: `Time In ${clockLabel(target.timeIn)} · Time Out ${clockLabel(target.timeOut)}`,
    })
  }

  entries.push({
    id: 'aud-2',
    at: new Date(Date.now() - 3 * 86400000 + 3600000).toISOString(),
    by: 'Rina Domingo',
    action: 'Balance adjustment',
    employeeId: 'stf-paolo',
    employeeName: 'Paolo Cruz',
    reason: 'Carried over unused credits from the last cycle.',
    before: 'Sick Leave remaining: 10',
    after: 'Sick Leave remaining: 13',
  })

  return entries
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 3600000).toISOString()
}

export function createSeedInquiries(): Inquiry[] {
  return [
    {
      id: 'inq-1001',
      fullName: 'Camille Bautista',
      email: 'camille.bautista@example.com',
      mobile: '0917 555 1234',
      subject: 'Weekend appointments',
      message:
        'Hi! Do you have Saturday afternoon slots for a Hydrafacial? I can only come in after 2 PM on weekends.',
      status: 'New',
      createdAt: hoursAgo(3),
      reply: null,
    },
    {
      id: 'inq-1002',
      fullName: 'Diego Mercado',
      email: 'diego.mercado@example.com',
      mobile: '0918 555 7788',
      subject: 'Acne package pricing',
      message:
        'I have been dealing with cystic acne for a year. Do you offer a package for six sessions, and how much would that cost?',
      status: 'New',
      createdAt: hoursAgo(9),
      reply: null,
    },
    {
      id: 'inq-1003',
      fullName: 'Sofia Lim',
      email: 'sofia.lim@example.com',
      mobile: '0917 555 4455',
      subject: 'Reschedule request',
      message: 'I need to move my Chemical Peel from Friday to any morning next week, if that is possible.',
      status: 'Answered',
      createdAt: hoursAgo(30),
      reply: {
        text: 'Hi Sofia, we have moved you to Tuesday at 10:00 AM. You will get a fresh confirmation shortly. See you then!',
        by: 'Rina Domingo',
        at: hoursAgo(26),
      },
    },
    {
      id: 'inq-1004',
      fullName: 'Marcus Reyes',
      email: 'marcus.reyes@example.com',
      mobile: '0920 555 9090',
      subject: 'Laser on sensitive skin',
      message:
        'My skin reacts easily and I have mild rosacea. Is laser hair removal on the upper lip safe for me?',
      status: 'New',
      createdAt: hoursAgo(20),
      reply: null,
    },
    {
      id: 'inq-1005',
      fullName: 'Andrea Villanueva',
      email: 'andrea.villanueva@example.com',
      mobile: '0917 555 3322',
      subject: 'HMO coverage',
      message: 'Do you accept HMO for consultations, and can I use it for follow-up visits?',
      status: 'Answered',
      createdAt: hoursAgo(52),
      reply: {
        text: 'Hello Andrea, we accept major HMOs for consultations and follow-ups. Bring your card and LOA on your first visit and we will handle the rest.',
        by: 'Rina Domingo',
        at: hoursAgo(48),
      },
    },
    {
      id: 'inq-1006',
      fullName: 'Tomas Aquino',
      email: 'tomas.aquino@example.com',
      mobile: '0917 555 6611',
      subject: 'Gift certificate',
      message: 'I would like to buy a gift certificate for a brightening facial. How do I order one?',
      status: 'New',
      createdAt: hoursAgo(40),
      reply: null,
    },
  ]
}
