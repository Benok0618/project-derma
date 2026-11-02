<script setup lang="ts">
import { clinic } from '~/data/clinic'

const year = new Date().getFullYear()
</script>

<template>
  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <div>
          <NuxtLink to="/" class="brand" aria-label="Lumi Derma Studio, home">
            <BrandMark />
            <span class="brand-name">Lumi <em>Derma</em></span>
          </NuxtLink>
          <p class="muted" style="margin-top: 12px; max-width: 42ch">{{ clinic.blurb }}</p>
        </div>

        <div>
          <h4>Visit</h4>
          <div class="footer-list">
            <span>{{ clinic.address }}</span>
            <span>{{ clinic.hours }}</span>
          </div>
        </div>

        <div>
          <h4>Get in touch</h4>
          <div class="footer-list">
            <a :href="`tel:${clinic.phone.replace(/\s+/g, '')}`">{{ clinic.phone }}</a>
            <a :href="`mailto:${clinic.email}`">{{ clinic.email }}</a>
            <NuxtLink to="/book">Book an appointment</NuxtLink>
            <NuxtLink to="/login">Staff Login</NuxtLink>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <span>© {{ year }} {{ clinic.name }}. Demo prototype.</span>
        <span>Not a real clinic. Sample services and prices only.</span>
      </div>
    </div>
  </footer>
</template>
