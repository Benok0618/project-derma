import type { Toast, ToastType } from '~/types'
import { uid } from '~/utils/id'

export function useToast() {
  const toasts = useState<Toast[]>('lds-toasts', () => [])

  function dismiss(id: string): void {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  function push(type: ToastType, message: string): void {
    const id = uid('toast')
    toasts.value = [...toasts.value, { id, type, message }]
    if (import.meta.client) {
      setTimeout(() => dismiss(id), 3800)
    }
  }

  return {
    toasts,
    dismiss,
    push,
    success: (message: string) => push('success', message),
    error: (message: string) => push('error', message),
    info: (message: string) => push('info', message),
  }
}
