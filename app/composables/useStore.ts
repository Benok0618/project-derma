import { computed } from 'vue'
import type {
  AuditEntry,
  BookingDraft,
  ConfirmedBooking,
  Doctor,
  Holiday,
  HrSettings,
  Inquiry,
  LeaveAdjustment,
  LeaveRequest,
  LeaveType,
  PromoDiscount,
  StoreState,
  StaffAccount,
  TimeRecord,
} from '~/types'
import type { Service } from '~/data/services'
import {
  createSeedInquiries,
  createSeedAuditLog,
  createSeedLeaveRequests,
  createSeedTimeRecords,
  seedServices,
  seedStaff,
  seedPromos,
  seedDoctors,
  seedLeaveTypes,
  seedLeaveAdjustments,
  seedHolidays,
  seedHrSettings,
} from '~/data/seed'
import { storage } from '~/utils/storage'
import { uid } from '~/utils/id'

export function emptyBooking(): BookingDraft {
  return {
    step: 0,
    patient: { firstName: '', middleName: '', lastName: '', mobile: '', email: '' },
    guests: [],
    selectedIds: [],
    date: '',
    time: '',
    paymentMethod: 'gcash',
    touched: {},
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export interface ClockMeta {
  selfie?: string | null
  locationVerified?: boolean | null
}

export function buildSeedState(): StoreState {
  const timeRecords = createSeedTimeRecords()
  return {
    services: clone(seedServices),
    staff: clone(seedStaff),
    inquiries: createSeedInquiries(),
    timeRecords,
    bookings: [],
    promos: clone(seedPromos),
    doctors: clone(seedDoctors),
    leaveTypes: clone(seedLeaveTypes),
    leaveRequests: createSeedLeaveRequests(),
    leaveAdjustments: clone(seedLeaveAdjustments),
    holidays: clone(seedHolidays),
    hrSettings: clone(seedHrSettings),
    auditLog: createSeedAuditLog(timeRecords),
    session: null,
    booking: emptyBooking(),
    confirmedBooking: null,
  }
}

const PERSISTED_KEYS: Array<keyof StoreState> = [
  'services',
  'staff',
  'inquiries',
  'timeRecords',
  'bookings',
  'promos',
  'doctors',
  'leaveTypes',
  'leaveRequests',
  'leaveAdjustments',
  'holidays',
  'hrSettings',
  'auditLog',
  'session',
  'booking',
  'confirmedBooking',
]

export function useStore() {
  const state = useState<StoreState>('lds-store', buildSeedState)
  const ready = useState<boolean>('lds-store-ready', () => false)

  const services = computed(() => state.value.services)
  const activeServices = computed(() => state.value.services.filter((service) => service.active))
  const popularActiveServices = computed(() =>
    state.value.services.filter((service) => service.active && service.popular),
  )
  const activeStaff = computed(() => state.value.staff.filter((member) => member.active))
  const activePromos = computed(() => state.value.promos.filter((p) => p.active))
  const activeDoctors = computed(() => state.value.doctors.filter((d) => d.active))
  const bookings = computed(() => state.value.bookings)
  const bookedSlots = computed(() =>
    state.value.bookings
      .filter((booking) => booking.date && booking.time)
      .map((booking) => ({ date: booking.date, time: booking.time })),
  )
  const leaveTypes = computed(() => state.value.leaveTypes)
  const leaveRequests = computed(() => state.value.leaveRequests)
  const leaveAdjustments = computed(() => state.value.leaveAdjustments)
  const holidays = computed(() => state.value.holidays)
  const hrSettings = computed(() => state.value.hrSettings)
  const auditLog = computed(() => state.value.auditLog)

  function serviceById(id: string): Service | undefined {
    return state.value.services.find((service) => service.id === id)
  }

  function staffById(id: string): StaffAccount | undefined {
    return state.value.staff.find((member) => member.id === id)
  }

  function promoById(id: string): PromoDiscount | undefined {
    return state.value.promos.find((p) => p.id === id)
  }

  function doctorById(id: string): Doctor | undefined {
    return state.value.doctors.find((d) => d.id === id)
  }

  function staffName(member?: StaffAccount | null): string {
    return member ? `${member.firstName} ${member.lastName}` : ''
  }

  function createService(input: Omit<Service, 'id'>): Service {
    const service: Service = { ...input, id: uid('svc') }
    state.value.services = [service, ...state.value.services]
    return service
  }

  function updateService(id: string, patch: Partial<Service>): void {
    const index = state.value.services.findIndex((service) => service.id === id)
    if (index === -1) return
    state.value.services[index] = { ...state.value.services[index]!, ...patch }
  }

  function createStaff(input: Omit<StaffAccount, 'id' | 'createdAt'>): StaffAccount {
    const member: StaffAccount = { ...input, id: uid('stf'), createdAt: new Date().toISOString() }
    state.value.staff = [...state.value.staff, member]
    return member
  }

  function updateStaff(id: string, patch: Partial<StaffAccount>): void {
    const index = state.value.staff.findIndex((member) => member.id === id)
    if (index === -1) return
    state.value.staff[index] = { ...state.value.staff[index]!, ...patch }
  }

  function createPromo(input: Omit<PromoDiscount, 'id' | 'createdAt'>): PromoDiscount {
    const promo: PromoDiscount = { ...input, id: uid('promo'), createdAt: new Date().toISOString() }
    state.value.promos = [promo, ...state.value.promos]
    return promo
  }

  function updatePromo(id: string, patch: Partial<PromoDiscount>): void {
    const index = state.value.promos.findIndex((p) => p.id === id)
    if (index === -1) return
    state.value.promos[index] = { ...state.value.promos[index]!, ...patch }
  }

  function createDoctor(input: Omit<Doctor, 'id' | 'createdAt'>): Doctor {
    const doctor: Doctor = { ...input, id: uid('doc'), createdAt: new Date().toISOString() }
    state.value.doctors = [...state.value.doctors, doctor]
    return doctor
  }

  function updateDoctor(id: string, patch: Partial<Doctor>): void {
    const index = state.value.doctors.findIndex((d) => d.id === id)
    if (index === -1) return
    state.value.doctors[index] = { ...state.value.doctors[index]!, ...patch }
  }

  function createInquiry(input: Omit<Inquiry, 'id' | 'createdAt' | 'status' | 'reply'>): Inquiry {
    const inquiry: Inquiry = {
      ...input,
      id: uid('inq'),
      status: 'New',
      createdAt: new Date().toISOString(),
      reply: null,
    }
    state.value.inquiries = [inquiry, ...state.value.inquiries]
    return inquiry
  }

  function answerInquiry(id: string, text: string, by: string): void {
    const index = state.value.inquiries.findIndex((inquiry) => inquiry.id === id)
    if (index === -1) return
    state.value.inquiries[index] = {
      ...state.value.inquiries[index]!,
      status: 'Answered',
      reply: { text, by, at: new Date().toISOString() },
    }
  }

  function recordFor(staffId: string, date: string): TimeRecord | undefined {
    return state.value.timeRecords.find((record) => record.staffId === staffId && record.date === date)
  }

  function ensureRecord(staffId: string, date: string): TimeRecord {
    const existing = recordFor(staffId, date)
    if (existing) return existing
    const created: TimeRecord = {
      id: `tr-${staffId}-${date}`,
      staffId,
      date,
      timeIn: null,
      timeOut: null,
      selfie: null,
      locationVerified: null,
    }
    state.value.timeRecords = [...state.value.timeRecords, created]
    return created
  }

  function applyMeta(record: TimeRecord, meta?: ClockMeta): void {
    if (!meta) return
    if (meta.selfie !== undefined) record.selfie = meta.selfie
    if (meta.locationVerified !== undefined) record.locationVerified = meta.locationVerified
  }

  function clockIn(staffId: string, date: string, meta?: ClockMeta): void {
    const record = ensureRecord(staffId, date)
    if (record.timeIn) return
    record.timeIn = new Date().toISOString()
    applyMeta(record, meta)
  }

  function clockOut(staffId: string, date: string, meta?: ClockMeta): void {
    const record = recordFor(staffId, date)
    if (!record?.timeIn || record.timeOut) return
    record.timeOut = new Date().toISOString()
    applyMeta(record, meta)
  }

  function createLeaveType(input: Omit<LeaveType, 'id'>): LeaveType {
    const type: LeaveType = { ...input, id: uid('lt') }
    state.value.leaveTypes = [...state.value.leaveTypes, type]
    return type
  }

  function updateLeaveType(id: string, patch: Partial<LeaveType>): void {
    const index = state.value.leaveTypes.findIndex((type) => type.id === id)
    if (index === -1) return
    state.value.leaveTypes[index] = { ...state.value.leaveTypes[index]!, ...patch }
  }

  function createHoliday(input: Omit<Holiday, 'id'>): Holiday {
    const holiday: Holiday = { ...input, id: uid('hol') }
    state.value.holidays = [...state.value.holidays, holiday].sort((a, b) =>
      a.date < b.date ? -1 : 1,
    )
    return holiday
  }

  function updateHoliday(id: string, patch: Partial<Holiday>): void {
    const index = state.value.holidays.findIndex((holiday) => holiday.id === id)
    if (index === -1) return
    state.value.holidays[index] = { ...state.value.holidays[index]!, ...patch }
    state.value.holidays = [...state.value.holidays].sort((a, b) => (a.date < b.date ? -1 : 1))
  }

  function deleteHoliday(id: string): void {
    state.value.holidays = state.value.holidays.filter((holiday) => holiday.id !== id)
  }

  function addLeaveRequest(input: Omit<LeaveRequest, 'id' | 'createdAt'>): LeaveRequest {
    const request: LeaveRequest = { ...input, id: uid('lr'), createdAt: new Date().toISOString() }
    state.value.leaveRequests = [request, ...state.value.leaveRequests]
    return request
  }

  function updateLeaveRequest(id: string, patch: Partial<LeaveRequest>): void {
    const index = state.value.leaveRequests.findIndex((request) => request.id === id)
    if (index === -1) return
    state.value.leaveRequests[index] = { ...state.value.leaveRequests[index]!, ...patch }
  }

  function addAdjustment(input: Omit<LeaveAdjustment, 'id' | 'at'>): LeaveAdjustment {
    const adjustment: LeaveAdjustment = { ...input, id: uid('ladj'), at: new Date().toISOString() }
    state.value.leaveAdjustments = [...state.value.leaveAdjustments, adjustment]
    return adjustment
  }

  function addAudit(entry: Omit<AuditEntry, 'id' | 'at'>): void {
    const saved: AuditEntry = { ...entry, id: uid('aud'), at: new Date().toISOString() }
    state.value.auditLog = [saved, ...state.value.auditLog].slice(0, 400)
  }

  function saveSettings(patch: Partial<HrSettings>): void {
    state.value.hrSettings = { ...state.value.hrSettings, ...patch }
  }

  function addBooking(booking: ConfirmedBooking): void {
    state.value.bookings = [booking, ...state.value.bookings]
    state.value.confirmedBooking = booking
  }

  function resetBooking(): void {
    state.value.booking = emptyBooking()
    state.value.confirmedBooking = null
  }

  function hydrate(): void {
    const persisted = storage.read<Partial<StoreState>>({})
    const next = buildSeedState()
    if (persisted && typeof persisted === 'object') {
      for (const key of PERSISTED_KEYS) {
        if (persisted[key] !== undefined) {
          (next as unknown as Record<string, unknown>)[key] = persisted[key]
        }
      }
    }
    state.value = next
    ready.value = true
  }

  function persist(): void {
    const snapshot: Record<string, unknown> = {}
    for (const key of PERSISTED_KEYS) {
      snapshot[key] = state.value[key]
    }
    storage.write(snapshot)
  }

  function resetAll(): void {
    state.value = buildSeedState()
    storage.clear()
    persist()
  }

  const currentUser = computed(() => {
    const session = state.value.session
    if (!session) return null
    return staffById(session.staffId) ?? null
  })

  return {
    state,
    ready,
    services,
    activeServices,
    popularActiveServices,
    activeStaff,
    activePromos,
    activeDoctors,
    bookings,
    bookedSlots,
    leaveTypes,
    leaveRequests,
    leaveAdjustments,
    holidays,
    hrSettings,
    auditLog,
    currentUser,
    serviceById,
    staffById,
    promoById,
    doctorById,
    staffName,
    createService,
    updateService,
    createStaff,
    updateStaff,
    createPromo,
    updatePromo,
    createDoctor,
    updateDoctor,
    createInquiry,
    answerInquiry,
    recordFor,
    ensureRecord,
    clockIn,
    clockOut,
    createLeaveType,
    updateLeaveType,
    createHoliday,
    updateHoliday,
    deleteHoliday,
    addLeaveRequest,
    updateLeaveRequest,
    addAdjustment,
    addAudit,
    saveSettings,
    addBooking,
    resetBooking,
    hydrate,
    persist,
    resetAll,
  }
}
