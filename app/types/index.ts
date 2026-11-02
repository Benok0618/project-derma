import type { Service } from '~/data/services'

export type StaffRole = 'HR Admin' | 'Front Desk' | 'Facialist' | 'Employee'

export interface StaffAccount {
  id: string
  firstName: string
  lastName: string
  email: string
  mobile: string
  role: StaffRole
  jobTitle?: string
  dateHired?: string
  password: string
  active: boolean
  createdAt: string
}

export type InquiryStatus = 'New' | 'Answered'

export interface InquiryReply {
  text: string
  by: string
  at: string
}

export interface Inquiry {
  id: string
  fullName: string
  email: string
  mobile: string
  subject: string
  message: string
  status: InquiryStatus
  createdAt: string
  reply: InquiryReply | null
}

export interface TimeRecord {
  id: string
  staffId: string
  date: string
  timeIn: string | null
  timeOut: string | null
  selfie?: string | null
  locationVerified?: boolean | null
  edited?: boolean
  editReason?: string
}

export type HrRole = 'HR Admin' | 'Employee'

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled'

export interface LeaveType {
  id: string
  name: string
  yearlyCredits: number
  paid: boolean
  active: boolean
}

export interface LeaveRequest {
  id: string
  employeeId: string
  typeId: string
  startDate: string
  endDate: string
  halfDay: boolean
  reason: string
  workingDays: number
  status: LeaveStatus
  comment?: string
  decidedBy?: string
  decidedAt?: string
  createdAt: string
}

export interface LeaveAdjustment {
  id: string
  employeeId: string
  typeId: string
  delta: number
  reason: string
  by: string
  at: string
}

export type HolidayType = 'Regular Holiday' | 'Special Non-Working Day' | 'Company Day Off'

export interface Holiday {
  id: string
  name: string
  date: string
  type: HolidayType
}

export interface HrSettings {
  shiftStart: string
  shiftEnd: string
  graceMinutes: number
  requiredHours: number
  workingDays: number[]
  requireSelfie: boolean
  requireLocation: boolean
  latitude: number
  longitude: number
  radiusMeters: number
}

export interface AuditEntry {
  id: string
  at: string
  by: string
  action: string
  employeeId: string
  employeeName: string
  reason: string
  before: string
  after: string
}

export interface PromoDiscount {
  id: string
  name: string
  description: string
  type: 'percentage' | 'fixed'
  value: number
  code: string
  startDate: string
  endDate: string
  applicableServices: string[]
  minPurchase: number
  maxDiscount: number | null
  active: boolean
  createdAt: string
}

export interface Doctor {
  id: string
  firstName: string
  lastName: string
  email: string
  mobile: string
  specialty: string
  licenseNumber: string
  active: boolean
  createdAt: string
}

export interface Guest {
  id: string
  firstName: string
  lastName: string
}

export interface PatientDetails {
  firstName: string
  middleName: string
  lastName: string
  mobile: string
  email: string
}

export interface BookingDraft {
  step: number
  patient: PatientDetails
  guests: Guest[]
  selectedIds: string[]
  date: string
  time: string
  paymentMethod: string
  touched: Record<string, boolean>
}

export interface ConfirmedBooking {
  id: string
  reference: string
  createdAt: string
  patient: PatientDetails
  guests: Guest[]
  serviceIds: string[]
  serviceNames: string[]
  date: string
  time: string
  paymentMethod: string
  subtotal: number
  downpayment: number
  remaining: number
}

export interface AuthSession {
  staffId: string
  since: string
}

export interface StoreState {
  services: Service[]
  staff: StaffAccount[]
  inquiries: Inquiry[]
  timeRecords: TimeRecord[]
  bookings: ConfirmedBooking[]
  promos: PromoDiscount[]
  doctors: Doctor[]
  leaveTypes: LeaveType[]
  leaveRequests: LeaveRequest[]
  leaveAdjustments: LeaveAdjustment[]
  holidays: Holiday[]
  hrSettings: HrSettings
  auditLog: AuditEntry[]
  session: AuthSession | null
  booking: BookingDraft
  confirmedBooking: ConfirmedBooking | null
}

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  type: ToastType
  message: string
}
