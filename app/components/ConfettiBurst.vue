<script setup lang="ts">
import { onMounted, ref } from 'vue'

interface Piece {
  left: string
  delay: string
  duration: string
  color: string
  width: string
  height: string
}

const pieces = ref<Piece[]>([])
const colors = ['#b0314f', '#2f8f84', '#f5c08a', '#f2b279', '#c6b8e6', '#6f5bb0']

onMounted(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce) return
  pieces.value = Array.from({ length: 70 }, (_, index) => ({
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 0.9}s`,
    duration: `${1.8 + Math.random() * 1.6}s`,
    color: colors[index % colors.length] ?? '#b0314f',
    width: `${6 + Math.random() * 8}px`,
    height: `${8 + Math.random() * 10}px`,
  }))
})
</script>

<template>
  <div class="confetti" aria-hidden="true">
    <span
      v-for="(piece, index) in pieces"
      :key="index"
      class="confetti-piece"
      :style="{
        left: piece.left,
        background: piece.color,
        width: piece.width,
        height: piece.height,
        animationDelay: piece.delay,
        animationDuration: piece.duration,
      }"
    />
  </div>
</template>
