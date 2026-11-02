<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { clinic } from '~/data/clinic'

const open = ref(false)
const route = useRoute()

watch(
  () => route.fullPath,
  () => {
    open.value = false
  },
)
</script>

<template>
  <header class="header">
    <div class="container">
      <div class="header-inner">
        <NuxtLink to="/" class="brand" aria-label="Lumi Derma Studio, home">
          <BrandMark />
          <span class="brand-name">Lumi <em>Derma</em></span>
        </NuxtLink>

        <nav class="nav" aria-label="Primary">
          <NuxtLink to="/" class="nav-link">Home</NuxtLink>
          <NuxtLink to="/services" class="nav-link">Services</NuxtLink>
          <NuxtLink to="/about" class="nav-link">About</NuxtLink>
          <NuxtLink to="/contact" class="nav-link">Contact</NuxtLink>
        </nav>

        <div class="header-actions">
          <NuxtLink to="/login" class="nav-link staff-login">Staff login</NuxtLink>
          <NuxtLink to="/book" class="btn btn-primary btn-sm">Book appointment</NuxtLink>
        </div>

        <button
          type="button"
          class="hamburger"
          :class="{ 'is-open': open }"
          :aria-expanded="open"
          aria-controls="mobile-nav"
          :aria-label="open ? 'Close menu' : 'Open menu'"
          @click="open = !open"
        >
          <span />
        </button>
      </div>

      <Transition name="fade">
        <div v-show="open" id="mobile-nav" class="mobile-nav" :class="{ 'is-open': open }">
          <div class="mobile-nav-list">
            <NuxtLink to="/" class="nav-link">Home</NuxtLink>
            <NuxtLink to="/services" class="nav-link">Services</NuxtLink>
            <NuxtLink to="/about" class="nav-link">About</NuxtLink>
            <NuxtLink to="/contact" class="nav-link">Contact</NuxtLink>
            <NuxtLink to="/book" class="btn btn-primary">Book appointment</NuxtLink>
            <NuxtLink to="/login" class="nav-link staff-login">Staff login</NuxtLink>
            <a :href="`tel:${clinic.phone.replace(/\s+/g, '')}`" class="nav-link">{{ clinic.phone }}</a>
          </div>
        </div>
      </Transition>
    </div>
  </header>
</template>
