import { computed } from 'vue'
import type { Service } from '~/data/services'
import { useStore } from '~/composables/useStore'
import { generateReference } from '~/utils/format'

export interface PatientDetails {
  firstName: string
  middleName: string
  lastName: string
  mobile: string
  email: string
}

export interface Guest {
  id: string
  firstName: string
  lastName: string
}

export const MAX_GUESTS = 3
export const MIN_DOWNPAYMENT = 500
export const DOWNPAYMENT_RATE = 0.3

const MOBILE_PATTERN = /^(?:\+63|0)9\d{9}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function initialBooking() {
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

export function useBooking() {
  const store = useStore()

  const booking = computed(() => store.state.value.booking)
  const processing = useState<boolean>('booking-processing', () => false)
  const confirmed = computed(() => store.state.value.confirmedBooking !== null)

  const selectedServices = computed<Service[]>(() =>
    booking.value.selectedIds.map((id) => store.serviceById(id)).filter((s): s is Service => Boolean(s)),
  )

  const subtotal = computed(() => selectedServices.value.reduce((sum, s) => sum + s.price, 0))
  const totalDuration = computed(() => selectedServices.value.reduce((sum, s) => sum + s.durationMinutes, 0))

  const downpayment = computed(() => {
    const total = subtotal.value
    if (total <= 0) return 0
    const raw = Math.round(total * DOWNPAYMENT_RATE)
    return Math.min(total, Math.max(MIN_DOWNPAYMENT, raw))
  })

  const remaining = computed(() => Math.max(0, subtotal.value - downpayment.value))

  const patientErrors = computed(() => {
    const p = booking.value.patient
    return {
      firstName: p.firstName.trim() ? '' : 'Please enter your first name.',
      middleName: p.middleName.trim() ? '' : 'Please enter your middle name.',
      lastName: p.lastName.trim() ? '' : 'Please enter your last name.',
      mobile: !p.mobile.trim()
        ? 'Please enter your mobile number.'
        : MOBILE_PATTERN.test(p.mobile.replace(/\s+/g, ''))
          ? ''
          : 'Use 09XXXXXXXXX or +639XXXXXXXXX.',
      email: !p.email.trim()
        ? 'Please enter your email.'
        : EMAIL_PATTERN.test(p.email.trim())
          ? ''
          : 'That email does not look right.',
    }
  })

  const guestErrors = computed(() =>
    booking.value.guests.map((guest) => ({
      firstName: guest.firstName.trim() ? '' : 'First name is required.',
      lastName: guest.lastName.trim() ? '' : 'Last name is required.',
    })),
  )

  function touch(field: string) {
    booking.value.touched[field] = true
  }

  function isTouched(field: string): boolean {
    return Boolean(booking.value.touched[field])
  }

  function setPatient(field: keyof PatientDetails, value: string) {
    booking.value.patient[field] = value
  }

  function updateGuest(id: string, field: 'firstName' | 'lastName', value: string) {
    const guest = booking.value.guests.find((g) => g.id === id)
    if (guest) guest[field] = value
  }

  function addGuest() {
    if (booking.value.guests.length >= MAX_GUESTS) return
    booking.value.guests.push({
      id: `guest-${Date.now()}-${booking.value.guests.length}`,
      firstName: '',
      lastName: '',
    })
  }

  function removeGuest(id: string) {
    booking.value.guests = booking.value.guests.filter((g) => g.id !== id)
  }

  function isSelected(id: string): boolean {
    return booking.value.selectedIds.includes(id)
  }

  function toggleService(id: string) {
    if (isSelected(id)) {
      booking.value.selectedIds = booking.value.selectedIds.filter((s) => s !== id)
    } else {
      booking.value.selectedIds = [...booking.value.selectedIds, id]
    }
  }

  function selectService(id: string, selected = true) {
    if (selected && !isSelected(id)) booking.value.selectedIds = [...booking.value.selectedIds, id]
    if (!selected && isSelected(id)) booking.value.selectedIds = booking.value.selectedIds.filter((s) => s !== id)
  }

  function setDate(iso: string) {
    booking.value.date = iso
    booking.value.time = ''
  }

  function setTime(time: string) {
    booking.value.time = time
  }

  function setPaymentMethod(id: string) {
    booking.value.paymentMethod = id
  }

  const stepValid = computed(() => [
    detailsValid.value,
    booking.value.selectedIds.length > 0,
    Boolean(booking.value.date && booking.value.time),
    true,
    true,
  ])

  const detailsValid = computed(() => {
    const p = patientErrors.value
    const patientOk = !p.firstName && !p.middleName && !p.lastName && !p.mobile && !p.email
    const guestsOk = guestErrors.value.every((g) => !g.firstName && !g.lastName)
    return patientOk && guestsOk
  })

  function canProceed(current: number): boolean {
    return stepValid.value[current] === true
  }

  function goTo(step: number) {
    if (step < 0 || step > 4) return
    if (step > booking.value.step && !canProceed(booking.value.step)) return
    booking.value.step = step
  }

  function next() {
    if (!canProceed(booking.value.step)) return
    if (booking.value.step < 4) booking.value.step += 1
  }

  function back() {
    if (booking.value.step > 0) booking.value.step -= 1
  }

  async function submitPayment(): Promise<void> {
    if (processing.value) return
    processing.value = true
    const reference = generateReference()
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const svc = selectedServices.value
    const total = subtotal.value
    const dp = downpayment.value
    const confirmedBooking = {
      id: `bk-${Date.now()}`,
      reference,
      createdAt: new Date().toISOString(),
      patient: { ...booking.value.patient },
      guests: [...booking.value.guests],
      serviceIds: [...booking.value.selectedIds],
      serviceNames: svc.map((s) => s.name),
      date: booking.value.date,
      time: booking.value.time,
      paymentMethod: booking.value.paymentMethod,
      subtotal: total,
      downpayment: dp,
      remaining: total - dp,
    }
    store.addBooking(confirmedBooking)
    processing.value = false
  }

  function reset() {
    store.resetBooking()
    processing.value = false
  }

  const fullName = computed(() =>
    [booking.value.patient.firstName, booking.value.patient.middleName, booking.value.patient.lastName]
      .filter(Boolean)
      .join(' '),
  )

  return {
    state: booking,
    processing,
    confirmed,
    selectedServices,
    subtotal,
    totalDuration,
    downpayment,
    remaining,
    patientErrors,
    guestErrors,
    detailsValid,
    touch,
    isTouched,
    setPatient,
    updateGuest,
    addGuest,
    removeGuest,
    isSelected,
    toggleService,
    selectService,
    setDate,
    setTime,
    setPaymentMethod,
    goTo,
    next,
    back,
    canProceed,
    submitPayment,
    reset,
    fullName,
  }
}