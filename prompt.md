Build a fully working front-end prototype (no backend) of an online booking website for a dermatology clinic, using Nuxt (latest stable version, follow the current official Nuxt docs) with TypeScript, ready to deploy on Vercel with zero extra configuration. This is a live client demo, so it must look polished, colorful, and feel alive.

CLINIC

Use a fictional placeholder name: "Lumi Derma Studio" (keep the name in one config constant so it is easy to rename). Do not use any real clinic's name, logo, or copy.

TECH RULES

- Nuxt pages + layouts + components + composables. No server routes, no database, no external API calls.

- Styling: plain class-based CSS in one shared file, assets/css/app.css, registered in nuxt.config. No scoped styles, no Tailwind or utility-first classes, no UI component libraries. Use CSS variables for the palette, spacing, radius, and shadows.

- Inline SVG icons only (no icon packages that need runtime fetching). Load fonts via the Nuxt fonts module or a single Google Fonts import.

- Booking state lives in one composable (useState or Pinia) shared across steps.

- Minimal to no code comments.

- Respect prefers-reduced-motion: disable the animated background and reveal animations for those users.

- Fully responsive (mobile first), keyboard accessible, visible focus states, proper labels and aria attributes on the stepper, calendar, and form fields.

VISUAL DIRECTION (derma / skincare theme, colorful)

- Palette: fresh mint and aqua as the primary, blush pink, peach, soft lavender, and warm cream as accents, with a deep teal for text and headings. Colorful but clean and clinical-premium, not childish.

- Typography: an elegant serif or soft display font for headings (e.g. Fraunces or Playfair Display) paired with a clean sans (e.g. DM Sans or Plus Jakarta Sans).

- Animated background across the whole site: slowly drifting blurred gradient blobs in the palette colors plus subtle floating bubbles or dew-drop shapes. CSS-only animations, GPU-friendly (transform and opacity), no heavy libraries.

- Make every section feel alive: staggered scroll-reveal (fade and slide up), cards that lift and glow on hover, buttons with smooth gradient shifts, a stepper whose progress line fills with animation, calendar cells with a subtle pop on selection, animated price counters when totals change, and a confetti or sparkle moment on booking success.

- Glassmorphism cards (translucent white, soft border, soft shadow), generous rounded corners, soft shadows.

- Use CSS or SVG illustrations (skin-care shapes, droplets, leaves, sparkles). No copyrighted images and no external image URLs.

PAGES AND NAVIGATION

Sticky glass top navigation bar with the clinic logo/wordmark and links: Home, Services, Book Appointment (highlighted as a gradient CTA button). Collapses into an animated hamburger menu on mobile. Include a simple footer.

1. Home: animated hero with headline, short tagline, and CTA to book; a "Popular Treatments" preview; a "How booking works" row of 4 steps; a final CTA banner.

2. Services: full services list with a live search bar and category filter chips, as animated cards showing name, short description, duration, and price. Each card has a "Book this" button that jumps to the booking page with that service preselected.

3. Book Appointment: the stepper flow below.

SAMPLE DATA (static, in one data file)

Create about 16 sample dermatology services across categories (Consultation, Acne and Scar, Facial and Glow, Laser, Anti-Aging, Hair and Nails, Body). Each has: id, name, category, short description, durationMinutes, price in Philippine pesos (format as ₱1,500.00), and a popular boolean. Mark 4 to 5 as popular or most common, for example Skin Consultation, Acne Treatment, Hydrafacial, Chemical Peel, Laser Hair Removal.

BOOKING FLOW (stepper component)

Horizontal stepper on desktop and compact on mobile, with a numbered progress line, current step highlighted, and completed steps showing a check mark. Back and Next buttons with slide transitions between steps. Next is disabled until the step is valid. Users can click completed steps to go back.

Step 1: Your Details

- Required: First Name, Middle Name, Last Name, Mobile Number (valid Philippine format, e.g. 09XXXXXXXXX or +639XXXXXXXXX), Email (valid format).

- Inline validation with friendly error messages.

- "Add a guest" toggle/button. When added, show a guest card requiring Guest First Name and Guest Last Name. Allow up to 3 guests, each removable with an animation.

Step 2: Choose Services

- Top section "Most Common / Popular" as highlighted, larger cards, with a "Popular" badge.

- Below it, "All Services" with a search input (live filter by name, category, and description) and an empty state when nothing matches.

- Multi-select with check animation. Show a floating selected-services tray with a running total. At least one service is required.

Step 3: Date and Time

- Month calendar with previous and next month navigation, showing the current month and the next 2 months.

- Unavailable dates (past dates, Sundays, and a few fixed sample closed days) must be visibly crossed out (strikethrough), dimmed, and disabled (not focusable or clickable).

- Every available date has its own fixed list of hourly time slots (for example 9:00 AM to 5:00 PM, skipping 12:00 PM to 1:00 PM). Vary the slots per date from a deterministic seed so it looks realistic, with some slots shown as taken and disabled.

- After picking a date, the time slots animate in as selectable chips. Both date and time are required.

Step 4: Review

- A clean preview of everything: patient details, guests, selected services with durations and prices, chosen date and time, and a total. Each section has an "Edit" link that jumps back to that step.

Step 5: Downpayment and Summary

- Message: "To confirm your booking, please pay the downpayment."

- Downpayment scales with the selected services: 30% of the total, with a minimum of ₱500 and never more than the total. Animate the amount when services change.

- Payment summary card: services subtotal, downpayment due now, remaining balance payable at the clinic.

- Mock payment method selector with GCash, Maya, and Credit/Debit Card options (text labels and generic icons only, no brand logos). A "Pay Downpayment" button runs a simulated 2-second processing state, then shows a success screen.

- Clearly state in the UI that this is a demo and no real payment is processed. Write the code so a real payment provider can be plugged in later.

Success screen: animated checkmark, confetti or sparkles, a generated booking reference (e.g. LDS-2026-XXXX), a full booking summary, and buttons for "Book another appointment" (resets state) and "Back to Home".

OUTPUT FORMAT

1. Show the complete file tree first.

2. Then give the full contents of every file (no truncation, no "rest of code here").

3. Finish with exact commands to install, run locally, and deploy to Vercel.