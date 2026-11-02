<script setup lang="ts">
import { computed } from 'vue'
import { clinic } from '~/data/clinic'
import { useStore } from '~/composables/useStore'
import { useBooking } from '~/composables/useBooking'
import { formatPeso } from '~/utils/format'

useHead({ title: `${clinic.name} — dermatology appointments online` })

const store = useStore()
const { selectService } = useBooking()

const popularServices = computed(() => store.popularActiveServices.value)
const consultation = computed(() => store.serviceById('skin-consultation'))

const flow = [
  { title: 'Tell us about you', body: 'Your name, contact, and anyone joining your visit.' },
  { title: 'Choose treatments', body: 'Browse the full menu and select what your skin needs.' },
  { title: 'Pick a date and time', body: 'See only the dates and time slots that are open.' },
  { title: 'Pay a small downpayment', body: 'Lock in your slot, settle the balance at the studio.' },
]

function bookService(id: string) {
  selectService(id, true)
  navigateTo('/book')
}
</script>

<template>
  <div>
    <section class="hero">
      <div class="container">
        <div class="hero-grid">
          <div class="hero-copy">
            <h1>Skin that feels as good as it looks.</h1>
            <p class="lede">
              {{ clinic.name }} is a calm, modern studio for acne care, glows, and laser
              treatments. Book with a licensed dermatologist in under two minutes.
            </p>
            <div class="hero-actions">
              <NuxtLink to="/book" class="btn btn-primary">Book an appointment</NuxtLink>
              <NuxtLink to="/services" class="btn btn-ghost">Browse services</NuxtLink>
            </div>
          </div>

          <aside class="hero-visit">
            <div class="hero-visit-head">
              <div>
                <p class="hero-visit-label">First visit</p>
                <h2 class="hero-visit-title">Skin Consultation</h2>
              </div>
              <span class="badge badge-cool">Most booked</span>
            </div>

            <ul class="hero-visit-list">
              <li>
                <AppIcon name="face" />
                <span>A one-on-one assessment with a dermatologist</span>
              </li>
              <li>
                <AppIcon name="droplet" />
                <span>A written plan for your skin concerns</span>
              </li>
              <li>
                <AppIcon name="sparkle" />
                <span>Aftercare guidance you can follow at home</span>
              </li>
            </ul>

            <div class="hero-visit-foot">
              <span class="hero-visit-price">
                <ClientOnly fallback="₱1,500">{{ formatPeso(consultation?.price ?? 1500) }}</ClientOnly>
              </span>
              <span class="hero-visit-duration">
                <ClientOnly fallback="30 min">{{ consultation?.durationMinutes ?? 30 }} min</ClientOnly>
              </span>
            </div>
          </aside>
        </div>

        <div class="hero-trust">
          <div class="hero-stat">
            <strong>17</strong>
            <span>curated treatments</span>
          </div>
          <div class="hero-stat">
            <strong>30 min</strong>
            <span>average consult</span>
          </div>
          <div class="hero-stat">
            <strong>Mon–Sat</strong>
            <span>9:00 AM to 5:00 PM</span>
          </div>
          <div class="hero-stat">
            <strong>30%</strong>
            <span>downpayment to book</span>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-head reveal" v-reveal>
          <div>
            <h2>Loved by first-time visitors</h2>
            <p class="lede">The treatments our patients book most often, ready to schedule right away.</p>
          </div>
          <NuxtLink to="/services" class="btn btn-ghost">See all services</NuxtLink>
        </div>

        <ClientOnly fallback="Loading popular treatments…">
          <div class="service-grid service-grid-lg" v-if="popularServices.length">
            <ServiceCard
              v-for="service in popularServices"
              :key="service.id"
              :service="service"
              @book="bookService"
            />
          </div>
          <div v-else class="empty-state">
            <AppIcon name="face" />
            <h3>No popular treatments right now</h3>
            <p class="muted" style="margin-top: 8px">Check back soon or browse all services.</p>
          </div>
        </ClientOnly>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-head reveal" v-reveal>
          <div>
            <h2>From booking to glow in four steps</h2>
            <p class="lede">Every step happens on this site, so you always know what comes next.</p>
          </div>
        </div>
        <div class="steps-row">
          <div
            v-for="(item, index) in flow"
            :key="item.title"
            v-reveal
            class="flow-card reveal"
            :style="{ transitionDelay: `${index * 90}ms` }"
          >
            <span class="flow-num">{{ index + 1 }}</span>
            <h3 style="font-size: 1.12rem">{{ item.title }}</h3>
            <p>{{ item.body }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="cta-banner reveal" v-reveal>
          <h2>Your skin deserves a proper appointment.</h2>
          <p class="lede">
            Pick a treatment, choose your time, and pay a small downpayment to confirm. No queues, no
            guesswork.
          </p>
          <div class="cta-banner-actions">
            <NuxtLink to="/book" class="btn btn-light">Book an appointment</NuxtLink>
            <NuxtLink to="/services" class="btn btn-light-ghost">Explore the menu</NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
