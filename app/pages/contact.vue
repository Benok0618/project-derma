<script setup lang="ts">
import { ref } from 'vue'
import { useStore } from '~/composables/useStore'
import { useToast } from '~/composables/useToast'
import { clinic } from '~/data/clinic'

const { createInquiry } = useStore()
const { success, error } = useToast()

const form = ref({
  fullName: '',
  email: '',
  mobile: '',
  subject: '',
  message: '',
})
const errors = ref<Record<string, string>>({})
const submitting = ref(false)
const submitted = ref(false)

const subjects = [
  'Appointment inquiry',
  'Service question',
  'Billing or insurance',
  'Feedback or complaint',
  'Other',
]

function validate() {
  errors.value = {}
  if (!form.value.fullName.trim()) errors.value.fullName = 'Please enter your full name.'
  if (!form.value.email.trim()) errors.value.email = 'Please enter your email.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.value.email)) errors.value.email = 'That email does not look right.'
  if (!form.value.mobile.trim()) errors.value.mobile = 'Please enter your mobile number.'
  else if (!/^(?:\+63|0)9\d{9}$/.test(form.value.mobile.replace(/\s+/g, ''))) errors.value.mobile = 'Use 09XXXXXXXXX or +639XXXXXXXXX.'
  if (!form.value.subject) errors.value.subject = 'Please select a subject.'
  if (!form.value.message.trim()) errors.value.message = 'Please enter your message.'
  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  if (!validate()) return
  submitting.value = true
  try {
    createInquiry({
      fullName: form.value.fullName.trim(),
      email: form.value.email.trim(),
      mobile: form.value.mobile.trim(),
      subject: form.value.subject,
      message: form.value.message.trim(),
    })
    submitted.value = true
    success('Your message has been sent. We will get back to you soon.')
  } catch {
    error('Something went wrong. Please try again.')
  } finally {
    submitting.value = false
  }
}

function resetForm() {
  form.value = { fullName: '', email: '', mobile: '', subject: '', message: '' }
  errors.value = {}
  submitted.value = false
}
</script>

<template>
  <div>
    <section class="page-head">
      <div class="container">
        <p class="eyebrow reveal" v-reveal>Contact us</p>
        <h1 class="reveal" v-reveal>We are here to help</h1>
        <p class="lede center reveal" v-reveal>
          Have a question about a treatment, need to reschedule, or want to share feedback?
          Fill the form and we will reply within one business day.
        </p>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="contact-grid">
          <div class="contact-info glass reveal" v-reveal>
            <h2>Clinic information</h2>
            <dl class="info-list">
              <div>
                <dt>Address</dt>
                <dd>{{ clinic.address }}</dd>
              </div>
              <div>
                <dt>Hours</dt>
                <dd>{{ clinic.hours }}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd><a :href="`tel:${clinic.phone.replace(/\s+/g, '')}`">{{ clinic.phone }}</a></dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd><a :href="`mailto:${clinic.email}`">{{ clinic.email }}</a></dd>
              </div>
            </dl>
            <p class="muted" style="margin-top: 20px">
              <AppIcon name="info" style="width: 18px; height: 18px; display: inline-block; margin-right: 8px; vertical-align: middle" />
              We respond during clinic hours. For urgent medical concerns, please visit the nearest emergency room.
            </p>
          </div>

          <div class="contact-form-wrap glass reveal" v-reveal>
            <h2 v-if="!submitted">Send us a message</h2>
            <div v-else class="success-state">
              <div class="success-badge">
                <svg viewBox="0 0 52 52" aria-hidden="true">
                  <circle cx="26" cy="26" r="24" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="2" />
                  <path d="M15 27l8 8 15-17" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>
              <h2>Message sent!</h2>
              <p class="lede">Thank you for reaching out. We have received your inquiry and will get back to you within 24 hours.</p>
              <button type="button" class="btn btn-primary" style="margin-top: 20px" @click="resetForm">Send another message</button>
            </div>

            <form v-if="!submitted" @submit.prevent="handleSubmit" novalidate>
              <div class="field">
                <label for="fullName">Full name <span aria-hidden="true">*</span></label>
                <input
                  id="fullName"
                  v-model="form.fullName"
                  type="text"
                  autocomplete="name"
                  required
                  :aria-invalid="!!errors.fullName"
                />
                <p v-if="errors.fullName" class="field-error" role="alert">{{ errors.fullName }}</p>
              </div>

              <div class="field-grid-2">
                <div class="field">
                  <label for="email">Email <span aria-hidden="true">*</span></label>
                  <input
                    id="email"
                    v-model="form.email"
                    type="email"
                    autocomplete="email"
                    required
                    :aria-invalid="!!errors.email"
                  />
                  <p v-if="errors.email" class="field-error" role="alert">{{ errors.email }}</p>
                </div>

                <div class="field">
                  <label for="mobile">Mobile number <span aria-hidden="true">*</span></label>
                  <input
                    id="mobile"
                    v-model="form.mobile"
                    type="tel"
                    autocomplete="tel"
                    required
                    placeholder="09XXXXXXXXX"
                    :aria-invalid="!!errors.mobile"
                  />
                  <p v-if="errors.mobile" class="field-error" role="alert">{{ errors.mobile }}</p>
                </div>
              </div>

              <div class="field">
                <label for="subject">Subject <span aria-hidden="true">*</span></label>
                <select
                  id="subject"
                  v-model="form.subject"
                  required
                  :aria-invalid="!!errors.subject"
                >
                  <option value="">Choose a subject</option>
                  <option v-for="s in subjects" :key="s" :value="s">{{ s }}</option>
                </select>
                <p v-if="errors.subject" class="field-error" role="alert">{{ errors.subject }}</p>
              </div>

              <div class="field">
                <label for="message">Message <span aria-hidden="true">*</span></label>
                <textarea
                  id="message"
                  v-model="form.message"
                  rows="5"
                  required
                  placeholder="Tell us how we can help…"
                  :aria-invalid="!!errors.message"
                ></textarea>
                <p v-if="errors.message" class="field-error" role="alert">{{ errors.message }}</p>
              </div>

              <button type="submit" class="btn btn-primary" style="width: 100%" :disabled="submitting">
                <span v-if="submitting">Sending…</span>
                <span v-else>Send message</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>