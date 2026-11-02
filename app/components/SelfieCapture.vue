<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref } from 'vue'

const props = defineProps<{ modelValue?: string | null; label?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string | null]; failed: [] }>()

const videoEl = ref<HTMLVideoElement | null>(null)
const canvasEl = ref<HTMLCanvasElement | null>(null)
const streaming = ref(false)
const note = ref('')
let stream: MediaStream | null = null

function stop() {
  stream?.getTracks().forEach((track) => track.stop())
  stream = null
  streaming.value = false
}

async function open() {
  note.value = ''
  if (!navigator.mediaDevices?.getUserMedia) {
    note.value = 'Camera is not available on this device — you can still clock in.'
    emit('failed')
    return
  }
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: 320, height: 320 },
      audio: false,
    })
    streaming.value = true
    await nextTick()
    if (videoEl.value) {
      videoEl.value.srcObject = stream
      await videoEl.value.play()
    }
  } catch {
    note.value = 'Camera permission was not granted — you can still clock in.'
    streaming.value = false
    emit('failed')
  }
}

function capture() {
  const video = videoEl.value
  const canvas = canvasEl.value
  if (!video || !canvas) return
  const size = 160
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const side = Math.min(video.videoWidth, video.videoHeight)
  ctx.save()
  ctx.translate(size, 0)
  ctx.scale(-1, 1)
  ctx.drawImage(
    video,
    (video.videoWidth - side) / 2,
    (video.videoHeight - side) / 2,
    side,
    side,
    0,
    0,
    size,
    size,
  )
  ctx.restore()
  emit('update:modelValue', canvas.toDataURL('image/jpeg', 0.6))
  stop()
}

function retake() {
  emit('update:modelValue', null)
  open()
}

onBeforeUnmount(stop)
</script>

<template>
  <div class="selfie">
    <p class="selfie-label" id="selfie-label">{{ props.label || 'Selfie verification' }}</p>

    <img v-if="props.modelValue" class="selfie-preview" :src="props.modelValue" alt="Selfie preview" />
    <video
      v-else-if="streaming"
      ref="videoEl"
      class="selfie-video"
      autoplay
      muted
      playsinline
      aria-labelledby="selfie-label"
    />

    <div class="selfie-actions">
      <button
        v-if="props.modelValue"
        type="button"
        class="btn btn-ghost btn-sm"
        @click="retake"
      >
        Retake selfie
      </button>
      <template v-else-if="streaming">
        <button type="button" class="btn btn-soft btn-sm" @click="capture">Capture</button>
        <button type="button" class="btn btn-ghost btn-sm" @click="stop">Cancel</button>
      </template>
      <button v-else type="button" class="btn btn-soft btn-sm" @click="open">
        <AppIcon name="face" style="margin-right: 6px" />
        Take selfie
      </button>
    </div>

    <p v-if="note" class="selfie-note">{{ note }}</p>
    <canvas ref="canvasEl" class="visually-hidden" aria-hidden="true"></canvas>
  </div>
</template>
