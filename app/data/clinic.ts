export const clinic = {
  name: 'Lumi Derma Studio',
  wordmark: 'Lumi Derma',
  tagline: 'Clear, calm, glowing skin.',
  blurb:
    'A dermatology studio built around gentle, evidence-led care. Licensed dermatologists, honest advice, and treatments that respect your skin barrier.',
  phone: '+63 917 555 0142',
  email: 'hello@lumiderma.example',
  address: 'Ayala North Exchange, Makati City, Metro Manila',
  hours: 'Mon to Sat, 9:00 AM – 6:00 PM',
  currency: 'PHP',
  locale: 'en-PH',
  referencePrefix: 'LDS',
}

export const bookingSteps = [
  { key: 'details', label: 'Your details', short: 'Details' },
  { key: 'services', label: 'Choose services', short: 'Services' },
  { key: 'schedule', label: 'Date & time', short: 'Date' },
  { key: 'review', label: 'Review', short: 'Review' },
  { key: 'payment', label: 'Downpayment', short: 'Payment' },
] as const

export const paymentMethods = [
  { id: 'gcash', label: 'GCash', hint: 'E-wallet' },
  { id: 'maya', label: 'Maya', hint: 'E-wallet' },
  { id: 'card', label: 'Credit / Debit Card', hint: 'Visa, Mastercard' },
] as const
