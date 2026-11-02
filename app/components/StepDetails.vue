<script setup lang="ts">
import { useBooking, MAX_GUESTS } from '~/composables/useBooking'

const {
  state,
  patientErrors,
  guestErrors,
  touch,
  isTouched,
  setPatient,
  updateGuest,
  addGuest,
  removeGuest,
} = useBooking()

const fields = [
  { key: 'firstName', label: 'First name', type: 'text', autocomplete: 'given-name' },
  { key: 'middleName', label: 'Middle name', type: 'text', autocomplete: 'additional-name' },
  { key: 'lastName', label: 'Last name', type: 'text', autocomplete: 'family-name' },
] as const
</script>

<template>
  <div>
    <h2 class="step-title">Your details</h2>
    <p class="step-sub">We use these to confirm your appointment and send reminders.</p>

    <div class="field-grid">
      <div
        v-for="field in fields"
        :key="field.key"
        class="field"
        :class="{ 'has-error': isTouched(field.key) && patientErrors[field.key] }"
      >
        <label :for="`patient-${field.key}`">{{ field.label }}</label>
        <input
          :id="`patient-${field.key}`"
          :type="field.type"
          :autocomplete="field.autocomplete"
          :value="state.patient[field.key]"
          :aria-invalid="Boolean(isTouched(field.key) && patientErrors[field.key])"
          @input="setPatient(field.key, ($event.target as HTMLInputElement).value)"
          @blur="touch(field.key)"
        />
        <p v-if="isTouched(field.key) && patientErrors[field.key]" class="field-error" role="alert">
          {{ patientErrors[field.key] }}
        </p>
      </div>

      <div
        class="field"
        :class="{ 'has-error': isTouched('mobile') && patientErrors.mobile }"
      >
        <label for="patient-mobile">Mobile number</label>
        <input
          id="patient-mobile"
          type="tel"
          autocomplete="tel"
          placeholder="09XX XXX XXXX"
          :value="state.patient.mobile"
          :aria-invalid="Boolean(isTouched('mobile') && patientErrors.mobile)"
          @input="setPatient('mobile', ($event.target as HTMLInputElement).value)"
          @blur="touch('mobile')"
        />
        <p v-if="isTouched('mobile') && patientErrors.mobile" class="field-error" role="alert">
          {{ patientErrors.mobile }}
        </p>
      </div>

      <div class="field" :class="{ 'has-error': isTouched('email') && patientErrors.email }">
        <label for="patient-email">Email</label>
        <input
          id="patient-email"
          type="email"
          autocomplete="email"
          placeholder="you@example.com"
          :value="state.patient.email"
          :aria-invalid="Boolean(isTouched('email') && patientErrors.email)"
          @input="setPatient('email', ($event.target as HTMLInputElement).value)"
          @blur="touch('email')"
        />
        <p v-if="isTouched('email') && patientErrors.email" class="field-error" role="alert">
          {{ patientErrors.email }}
        </p>
      </div>
    </div>

    <div class="guest-block">
      <div class="guest-head">
        <div>
          <h3 style="font-size: 1.15rem">Bringing someone along?</h3>
          <p class="muted" style="font-size: 0.92rem">Add up to {{ MAX_GUESTS }} guests to book them in the same visit.</p>
        </div>
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          :disabled="state.guests.length >= MAX_GUESTS"
          @click="addGuest"
        >
          <AppIcon name="plus" /> Add a guest
        </button>
      </div>

      <TransitionGroup name="guest" tag="div" class="guest-list">
        <div v-for="(guest, index) in state.guests" :key="guest.id" class="guest-card">
          <div class="guest-card-head">
            <strong>Guest {{ index + 1 }}</strong>
            <button
              type="button"
              class="icon-btn"
              :aria-label="`Remove guest ${index + 1}`"
              @click="removeGuest(guest.id)"
            >
              <AppIcon name="x" />
            </button>
          </div>
          <div class="field-grid field-grid-2">
            <div
              class="field"
              :class="{ 'has-error': isTouched(`guest-${guest.id}-firstName`) && guestErrors[index]?.firstName }"
            >
              <label :for="`guest-${guest.id}-firstName`">Guest first name</label>
              <input
                :id="`guest-${guest.id}-firstName`"
                type="text"
                :value="guest.firstName"
                @input="updateGuest(guest.id, 'firstName', ($event.target as HTMLInputElement).value)"
                @blur="touch(`guest-${guest.id}-firstName`)"
              />
              <p
                v-if="isTouched(`guest-${guest.id}-firstName`) && guestErrors[index]?.firstName"
                class="field-error"
                role="alert"
              >
                {{ guestErrors[index]?.firstName }}
              </p>
            </div>
            <div
              class="field"
              :class="{ 'has-error': isTouched(`guest-${guest.id}-lastName`) && guestErrors[index]?.lastName }"
            >
              <label :for="`guest-${guest.id}-lastName`">Guest last name</label>
              <input
                :id="`guest-${guest.id}-lastName`"
                type="text"
                :value="guest.lastName"
                @input="updateGuest(guest.id, 'lastName', ($event.target as HTMLInputElement).value)"
                @blur="touch(`guest-${guest.id}-lastName`)"
              />
              <p
                v-if="isTouched(`guest-${guest.id}-lastName`) && guestErrors[index]?.lastName"
                class="field-error"
                role="alert"
              >
                {{ guestErrors[index]?.lastName }}
              </p>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>
