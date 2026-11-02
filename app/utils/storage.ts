const KEY = 'lumi-derma-studio'
const VERSION = 1

interface Envelope<T> {
  version: number
  savedAt: string
  data: T
}

function available(): boolean {
  try {
    return typeof window !== 'undefined' && Boolean(window.localStorage)
  } catch {
    return false
  }
}

export const storage = {
  available,

  read<T>(fallback: T): T {
    if (!available()) return fallback
    try {
      const raw = window.localStorage.getItem(KEY)
      if (!raw) return fallback
      const parsed = JSON.parse(raw) as Envelope<T>
      if (!parsed || parsed.version !== VERSION) return fallback
      return parsed.data
    } catch {
      return fallback
    }
  },

  write<T>(data: T): void {
    if (!available()) return
    try {
      const envelope: Envelope<T> = {
        version: VERSION,
        savedAt: new Date().toISOString(),
        data,
      }
      window.localStorage.setItem(KEY, JSON.stringify(envelope))
    } catch {
      void 0
    }
  },

  clear(): void {
    if (!available()) return
    try {
      window.localStorage.removeItem(KEY)
    } catch {
      void 0
    }
  },
}
