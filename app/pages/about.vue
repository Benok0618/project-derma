<script setup lang="ts">
import { clinic } from '~/data/clinic'
import { services } from '~/data/services'

useHead({ title: `About — ${clinic.name}` })

const facts = [
  { icon: 'calendar', label: 'Opened', value: '2019' },
  { icon: 'users', label: 'Dermatologists', value: '2 licensed' },
  { icon: 'sparkle', label: 'Treatments on the menu', value: `${services.length} and counting` },
  { icon: 'clock', label: 'Open', value: clinic.hours },
]

const principles = [
  {
    icon: 'face',
    title: 'Skin gets read before it gets treated',
    body: 'Every first visit starts with a consultation. If a treatment will not help your skin, we say so and stop there.',
  },
  {
    icon: 'shield',
    title: 'The skin barrier comes first',
    body: 'Strengths and schedules are picked for what your barrier can handle, then built up slowly. Recovery time is part of the plan, not an afterthought.',
  },
  {
    icon: 'wallet',
    title: 'Prices are published, not performed',
    body: 'Every price on the menu is the price you pay. The downpayment is 30% of the total, and the balance waits until you are in the chair.',
  },
  {
    icon: 'clock',
    title: 'Appointments are spaced, not stacked',
    body: 'Slots are booked with real gaps between them, so nobody is rushed out and nobody waits an hour past their time.',
  },
]

const story = [
  {
    year: '2019',
    title: 'Two rooms and a booking notebook',
    body: 'The studio opens on the second floor of Ayala North Exchange with one dermatologist and a paper appointment book.',
  },
  {
    year: '2021',
    title: 'The laser suite',
    body: 'A certified laser room joins the studio, bringing hair removal and pigmentation treatments in-house for the first time.',
  },
  {
    year: '2023',
    title: 'More hands, the same pace',
    body: 'Two more dermatologists and a lead aesthetician come on board. Appointment slots stay deliberately unhurried.',
  },
  {
    year: '2026',
    title: 'The notebook goes online',
    body: 'Consultations, downpayments, and reminders move onto this site, so a full booking takes about two minutes.',
  },
]

const team = [
  {
    initials: 'EV',
    name: 'Dra. Elena Villanueva',
    role: 'Medical Director · Dermatologist',
    focus: 'Acne, rosacea, and sensitive skin.',
    tone: 'avatar-mint',
  },
  {
    initials: 'MS',
    name: 'Dra. Marco Salazar',
    role: 'Laser and body specialist',
    focus: 'Hair removal, pigmentation, and skin tightening.',
    tone: 'avatar-aqua',
  },
  {
    initials: 'JR',
    name: 'Joy Ramirez, RMT',
    role: 'Lead aesthetician',
    focus: 'Hydrafacials, chemical peels, and aftercare.',
    tone: 'avatar-lavender',
  },
  {
    initials: 'PC',
    name: 'Paolo Cruz',
    role: 'Patient care',
    focus: 'Scheduling, reminders, and easy rescheduling.',
    tone: 'avatar-warm',
  },
]
</script>

<template>
  <div>
    <section class="about-hero">
      <div class="container">
        <div class="about-hero-grid">
          <div class="about-story">
            <p class="eyebrow reveal" v-reveal>About the studio</p>
            <h1 class="reveal" v-reveal>Meet the studio behind the booking.</h1>
            <p class="lede reveal" v-reveal>
              {{ clinic.name }} opened in 2019 with two treatment rooms, one dermatologist, and a
              simple rule that still holds: nothing gets done to your skin before someone has
              properly looked at it.
            </p>
            <p class="lede reveal" v-reveal>
              Today the studio runs consultations, facials, and laser sessions six days a week,
              led by licensed dermatologists and a small team of aestheticians who would rather
              recommend less than sell more.
            </p>
          </div>

          <aside class="about-card reveal" v-reveal aria-label="Studio at a glance">
            <p class="eyebrow">At a glance</p>
            <h3>{{ clinic.name }}</h3>
            <dl class="about-facts">
              <div v-for="fact in facts" :key="fact.label" class="about-fact">
                <AppIcon :name="fact.icon" />
                <dt>{{ fact.label }}</dt>
                <dd>{{ fact.value }}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="principles-grid">
          <div class="reveal" v-reveal>
            <p class="eyebrow">How we work</p>
            <h2 style="margin-top: var(--space-3)">Four rules the studio does not bend</h2>
            <p class="lede" style="margin-top: var(--space-4)">
              These are not slogans. They decide what we recommend, how long we book you for, and
              what happens at the front desk when plans change.
            </p>
          </div>

          <ul class="principle-list">
            <li
              v-for="(item, index) in principles"
              :key="item.title"
              v-reveal
              class="principle reveal"
              :style="{ transitionDelay: `${index * 80}ms` }"
            >
              <span class="principle-icon"><AppIcon :name="item.icon" /></span>
              <div>
                <h3>{{ item.title }}</h3>
                <p>{{ item.body }}</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-head reveal" v-reveal>
          <div>
            <p class="eyebrow">Our story</p>
            <h2>Seven years, four small changes</h2>
            <p class="lede">The studio grew the slow way, one room and one specialist at a time.</p>
          </div>
        </div>

        <ol class="timeline">
          <li
            v-for="(item, index) in story"
            :key="item.year"
            v-reveal
            class="timeline-item reveal"
            :style="{ transitionDelay: `${index * 90}ms` }"
          >
            <span class="timeline-year">{{ item.year }}</span>
            <span class="timeline-rail" aria-hidden="true" />
            <div class="timeline-body">
              <h3>{{ item.title }}</h3>
              <p>{{ item.body }}</p>
            </div>
          </li>
        </ol>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-head reveal" v-reveal>
          <div>
            <p class="eyebrow">The team</p>
            <h2>Who you will meet</h2>
            <p class="lede">
              Licensed dermatologists, an aesthetician, and the person who keeps the schedule
              honest.
            </p>
          </div>
        </div>

        <ul class="team-grid">
          <li
            v-for="(person, index) in team"
            :key="person.name"
            v-reveal
            class="team-card reveal"
            :style="{ transitionDelay: `${index * 80}ms` }"
          >
            <span class="team-avatar" :class="person.tone" aria-hidden="true">{{ person.initials }}</span>
            <h3>{{ person.name }}</h3>
            <p class="team-role">{{ person.role }}</p>
            <p>{{ person.focus }}</p>
          </li>
        </ul>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="cta-banner reveal" v-reveal>
          <h2>Ready when your skin is.</h2>
          <p class="lede">
            Book a consultation, pick your treatments, and choose a time that suits you. The
            downpayment is small, and the rest can wait until you arrive.
          </p>
          <div class="cta-banner-actions">
            <NuxtLink to="/book" class="btn btn-primary">Book an appointment</NuxtLink>
            <NuxtLink to="/services" class="btn btn-ghost">Browse services</NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
