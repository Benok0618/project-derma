export default defineNuxtPlugin((nuxtApp) => {
  function reveal(el: HTMLElement) {
    el.dataset.reveal = 'visible'
  }

  nuxtApp.vueApp.directive('reveal', {
    getSSRProps() {
      return {}
    },
    mounted(el: HTMLElement) {
      if (
        typeof IntersectionObserver === 'undefined' ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        reveal(el)
        return
      }
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              reveal(entry.target as HTMLElement)
              observer.unobserve(entry.target)
            }
          })
        },
        { threshold: 0.12, rootMargin: '0px 0px -60px 0px' },
      )
      observer.observe(el)
      ;(el as HTMLElement & { _revealObserver?: IntersectionObserver })._revealObserver = observer
    },
    unmounted(el: HTMLElement & { _revealObserver?: IntersectionObserver }) {
      el._revealObserver?.disconnect()
    },
  })
})
