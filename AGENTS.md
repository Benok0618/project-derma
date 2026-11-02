# Lumi Derma Studio — AGENTS.md

## Project Overview
Nuxt 4 (Vue 3, TypeScript) single-page app for a dermatology clinic. Two dashboards: **Admin** (HR Admin role) and **Staff** (Front Desk / Facialist). Client-side state persisted to `localStorage` via `useStore`.

## Tech Stack
- **Framework**: Nuxt 4.6+, Vue 3.5, TypeScript 5.6
- **Styling**: Custom CSS design system (`app/assets/css/app.css`) — glassmorphism, Fraunces display / Plus Jakarta Sans body
- **State**: `useStore` composable (Nuxt `useState`) with seeded demo data
- **Auth**: Simulated session in store (`AuthSession`), middleware protects `/admin/**` and `/staff/**`
- **Routing**: File-based under `app/pages/`, layouts in `app/layouts/`

## Key Commands
```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run generate  # Static generation
npm run typecheck # TypeScript check (vue-tsc)
npm run preview   # Preview production build
```

## Architecture Notes

### State (`app/composables/useStore.ts`)
Single reactive `StoreState` with:
- `services: Service[]` — treatments menu
- `staff: StaffAccount[]` — all accounts (HR Admin, Front Desk, Facialist)
- `inquiries: Inquiry[]` — patient messages
- `timeRecords: TimeRecord[]` — daily clock in/out (DTR)
- `bookings: ConfirmedBooking[]` — completed appointments
- `session: AuthSession | null` — current login

Persisted keys: `services`, `staff`, `inquiries`, `timeRecords`, `bookings`, `session`, `booking`, `confirmedBooking`.

### Auth (`app/composables/useAuth.ts`)
- `login(email, password)` → finds staff by email, checks password, sets `session`
- `homeFor(user)` → routes HR Admin to `/admin`, others to `/staff`
- Middleware (`app/middleware/auth.ts`) redirects unauthenticated to `/login`, non-HR from `/admin`

### Layouts
- **Admin** (`app/layouts/admin.vue`): Sidebar nav, topbar, logout, demo reset
- **Staff** (`app/layouts/staff.vue`): Topbar with live clock, time-in/out card, 7-day history
- **Default** (`app/layouts/default.vue`): Public pages (home, book, about, contact, services)

### Admin Pages (all under `/admin/**`, SSR disabled)
| Page | Purpose |
|------|---------|
| `index.vue` | Overview: stats, today's attendance, latest inquiries, sales comparison, calendar, reports |
| `services.vue` | CRUD services (name, category, duration, price, popular, active) |
| `promos.vue` | CRUD promos/discounts (type, value, code, dates, applicable services) |
| `doctors.vue` | CRUD doctors (name, email, mobile, specialty, license number) |
| `inquiries.vue` | List + detail panel, reply with quick templates |
| `time-records.vue` | Daily DTR table with filters, CSV export |
| `dtr-print.vue` | Print-friendly DTR report with date range, staff filter, print/CSV |
| `accounts.vue` | CRUD staff accounts (role, email, mobile, password) |

### Data Types (`app/types/index.ts`)
```ts
StaffRole = 'HR Admin' | 'Front Desk' | 'Facialist'
StaffAccount { id, firstName, lastName, email, mobile, role, password, active, createdAt }
Inquiry { id, fullName, email, mobile, subject, message, status, createdAt, reply }
TimeRecord { id, staffId, date (ISO), timeIn, timeOut }
ConfirmedBooking { id, reference, createdAt, patient, guests, serviceIds, serviceNames, date, time, paymentMethod, subtotal, downpayment, remaining }
```

### Utilities
- `app/utils/datetime.ts` — formatting, attendance status, worked hours
- `app/utils/calendar.ts` — calendar grid helpers
- `app/utils/format.ts` — currency (PHP)
- `app/utils/id.ts` — UID generator
- `app/utils/storage.ts` — localStorage wrapper

### Adding New Admin Pages
1. Create `app/pages/admin/your-page.vue`
2. Add nav item to `navItems` in `app/layouts/admin.vue`
3. Use `useStore()`, `useToast()`, `useHead()` pattern
4. Follow existing table/modal/filter patterns (see `services.vue`, `accounts.vue`)

### Styling Conventions
- Use CSS variables from `:root` (colors, spacing, radius, shadows)
- Components: `.glass` cards, `.btn` variants, `.data-table`, `.stat-grid`, `.admin-section`
- Icons: `<AppIcon name="..." />` (heroicons via `app/components/AppIcon.vue`)
- Toasts: `const { success, error } = useToast()`

### Demo Data
Seeded in `app/data/seed.ts`: 6 staff, 6 inquiries, 7 days of time records, 22 services.
Reset via "Reset demo data" button in admin sidebar.

## Current Gaps / Known Issues
- No real backend — all data in `localStorage`
- Calendar in booking flow only, not in admin dashboard (partially addressed - dashboard now has calendar)

## Recently Implemented HR Features (Oct 2026)

### New Data Types (`app/types/index.ts`)
```ts
PromoDiscount { id, name, description, type: 'percentage'|'fixed', value, code, startDate, endDate, applicableServices, minPurchase, maxDiscount, active, createdAt }
Doctor { id, firstName, lastName, email, mobile, specialty, licenseNumber, active, createdAt }
```

### New Admin Pages
| Page | Purpose |
|------|---------|
| `promos.vue` | CRUD promos/discounts (percentage/fixed, codes, validity dates, applicable services, min purchase, max discount) |
| `doctors.vue` | CRUD doctors (name, email, mobile, specialty, license number, active status) |
| `dtr-print.vue` | Print-friendly DTR report with date range, staff selection, print/CSV export |

### Enhanced Dashboard (`index.vue`)
- **Sales Comparison**: Month-over-month and year-over-year revenue cards with growth percentages
- **Calendar with Available Slots**: Interactive monthly calendar showing available dates, click to view time slots
- **Reports Summary**: Grid of key metrics (bookings, staff, services, doctors, promos, inquiries) + recent bookings table

### Updated State (`useStore.ts`)
- Added `promos: PromoDiscount[]` and `doctors: Doctor[]` to StoreState
- New computed: `activePromos`, `activeDoctors`
- New CRUD functions: `createPromo`, `updatePromo`, `createDoctor`, `updateDoctor`, `promoById`, `doctorById`
- Persisted keys updated to include `promos`, `doctors`

### Seed Data (`app/data/seed.ts`)
- Added 5 sample promos (Welcome Glow 20%, Acne Care ₱1500, Laser Loyalty 15%, Anti-Aging ₱2000, Student 10%)
- Added 5 sample doctors with specialties and license numbers

### New Icons (`AppIcon.vue`)
Added: `chevron-up`, `chevron-down`, `currency`, `tag`, `printer`, `user`

### Updated Components
- `StatCard.vue`: Now accepts string values (for formatted currency) and 'blush' tone
- `AnimatedNumber.vue`: New component handling both numeric and string values