import { watch } from 'vue'
import { useStore } from '~/composables/useStore'

export default defineNuxtPlugin(() => {
  const store = useStore()

  store.hydrate()

  watch(
    () => store.state.value,
    () => store.persist(),
    { deep: true },
  )
})
