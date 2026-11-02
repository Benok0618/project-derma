import { clinic } from '~/data/clinic'

export function formatPeso(amount: number): string {
  return new Intl.NumberFormat(clinic.locale, {
    style: 'currency',
    currency: clinic.currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours} hr ${rest} min` : `${hours} hr`
}

export function formatTime(time: string): string {
  if (!time) return ''
  const [hourRaw, minute = '00'] = time.split(':')
  const hour = Number(hourRaw)
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const display = hour % 12 === 0 ? 12 : hour % 12
  return `${display}:${minute} ${suffix}`
}

export function generateReference(): string {
  const year = new Date().getFullYear()
  const digits = Math.floor(1000 + Math.random() * 9000)
  return `${clinic.referencePrefix}-${year}-${digits}`
}
