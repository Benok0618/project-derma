export type ServiceCategory =
  | 'Consultation'
  | 'Acne & Scar'
  | 'Facial & Glow'
  | 'Laser'
  | 'Anti-Aging'
  | 'Hair & Nails'
  | 'Body'

export interface Service {
  id: string
  name: string
  category: ServiceCategory
  description: string
  durationMinutes: number
  price: number
  popular: boolean
  active: boolean
}

export const categories: ServiceCategory[] = [
  'Consultation',
  'Acne & Scar',
  'Facial & Glow',
  'Laser',
  'Anti-Aging',
  'Hair & Nails',
  'Body',
]

export const services: Service[] = [
  {
    id: 'skin-consultation',
    name: 'Skin Consultation',
    category: 'Consultation',
    description:
      'A one-on-one assessment with a dermatologist, with a personal plan for your skin concerns.',
    durationMinutes: 30,
    price: 1500,
    popular: true,
    active: true,
  },
  {
    id: 'follow-up-consultation',
    name: 'Follow-up Consultation',
    category: 'Consultation',
    description: 'Track your progress, adjust your routine, and review results from your treatment plan.',
    durationMinutes: 20,
    price: 900,
    popular: false,
    active: true,
  },
  {
    id: 'acne-treatment',
    name: 'Acne Treatment',
    category: 'Acne & Scar',
    description: 'Targeted in-clinic acne care with gentle extraction and calming, anti-inflammatory actives.',
    durationMinutes: 45,
    price: 2800,
    popular: true,
    active: true,
  },
  {
    id: 'acne-scar-microneedling',
    name: 'Acne Scar Microneedling',
    category: 'Acne & Scar',
    description: 'Micro-channels stimulate collagen to soften textured scars and even out skin tone.',
    durationMinutes: 60,
    price: 4500,
    popular: false,
    active: true,
  },
  {
    id: 'hydrafacial',
    name: 'Hydrafacial',
    category: 'Facial & Glow',
    description: 'Cleanse, extract, and hydrate in one session for an immediate, dewy, luminous finish.',
    durationMinutes: 60,
    price: 3500,
    popular: true,
    active: true,
  },
  {
    id: 'chemical-peel',
    name: 'Chemical Peel',
    category: 'Facial & Glow',
    description: 'A tailored acid peel that resurfaces dull skin and reveals a brighter, smoother layer.',
    durationMinutes: 45,
    price: 3200,
    popular: true,
    active: true,
  },
  {
    id: 'brightening-facial',
    name: 'Brightening Facial',
    category: 'Facial & Glow',
    description: 'Vitamin-rich facial that fades discoloration and restores a rested, even glow.',
    durationMinutes: 50,
    price: 2600,
    popular: false,
    active: true,
  },
  {
    id: 'laser-hair-removal',
    name: 'Laser Hair Removal',
    category: 'Laser',
    description: 'Comfortable diode laser sessions for long-lasting smoothness on face and body.',
    durationMinutes: 40,
    price: 4000,
    popular: true,
    active: true,
  },
  {
    id: 'pigmentation-laser',
    name: 'Pigmentation Laser',
    category: 'Laser',
    description: 'Precision laser to break down stubborn pigmentation, freckles, and sun spots.',
    durationMinutes: 45,
    price: 5200,
    popular: false,
    active: true,
  },
  {
    id: 'carbon-laser-facial',
    name: 'Carbon Laser Facial',
    category: 'Laser',
    description: 'A gentle laser glow-up that refines pores, calms oil, and revives tired skin.',
    durationMinutes: 40,
    price: 3800,
    popular: false,
    active: true,
  },
  {
    id: 'botox',
    name: 'Botox',
    category: 'Anti-Aging',
    description: 'Softened expression lines with a natural, refreshed look and quick recovery.',
    durationMinutes: 30,
    price: 6500,
    popular: false,
    active: true,
  },
  {
    id: 'skin-boosters',
    name: 'Skin Boosters',
    category: 'Anti-Aging',
    description: 'Deep hydration injections that plump fine lines and restore bounce to the skin.',
    durationMinutes: 45,
    price: 7800,
    popular: false,
    active: true,
  },
  {
    id: 'dermal-fillers',
    name: 'Dermal Fillers',
    category: 'Anti-Aging',
    description: 'Restore volume and contour with a physician-guided, subtle, balanced approach.',
    durationMinutes: 45,
    price: 9500,
    popular: false,
    active: true,
  },
  {
    id: 'prp-hair-restoration',
    name: 'PRP Hair Restoration',
    category: 'Hair & Nails',
    description: 'Platelet-rich plasma therapy to strengthen thinning hair and support regrowth.',
    durationMinutes: 60,
    price: 5500,
    popular: false,
    active: true,
  },
  {
    id: 'nail-fungus-laser',
    name: 'Nail Fungus Laser',
    category: 'Hair & Nails',
    description: 'Focused laser treatment that helps clear fungal infection and restore nail health.',
    durationMinutes: 40,
    price: 3000,
    popular: false,
    active: true,
  },
  {
    id: 'body-contouring',
    name: 'Body Contouring',
    category: 'Body',
    description: 'Non-invasive sculpting to tighten and smooth those hard-to-target areas.',
    durationMinutes: 60,
    price: 6000,
    popular: false,
    active: true,
  },
  {
    id: 'stretch-mark-treatment',
    name: 'Stretch Mark Treatment',
    category: 'Body',
    description: 'Collagen-stimulating care that visibly softens stretch marks over a course of sessions.',
    durationMinutes: 50,
    price: 4200,
    popular: false,
    active: true,
  },
]

export const popularServices = services.filter((s) => s.popular)

export function getService(id: string): Service | undefined {
  return services.find((s) => s.id === id)
}
