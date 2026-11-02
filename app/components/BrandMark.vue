<script setup lang="ts">
import { useId } from 'vue'

const gid = `brand-grad-${useId()}`
</script>

<template>
  <svg class="brand-mark" viewBox="0 0 48 48" role="img" aria-hidden="true">
    <defs>
      <linearGradient :id="gid" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#1f5c4d" />
        <stop offset="100%" stop-color="#2e7a64" />
      </linearGradient>
    </defs>
    <rect width="48" height="48" rx="15" :fill="`url(#${gid})`" />
    <path
      d="M24 11.5s9 9.7 9 15.6a9 9 0 0 1-18 0c0-5.9 9-15.6 9-15.6Z"
      fill="rgba(255,255,255,0.92)"
    />
    <path
      d="M24 20c-5.2 3.1-5.8 7.2-1.4 9.9 1.6-4 3.6-6.2 6-7.6-1.3-1.2-2.8-2-4.6-2.3Z"
      :fill="`url(#${gid})`"
    />
  </svg>
</template>
