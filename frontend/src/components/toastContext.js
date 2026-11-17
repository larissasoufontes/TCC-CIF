import { createContext, useContext } from 'react'

export const ToastContext = createContext(null)

export function useToast() {
  const mostrarToast = useContext(ToastContext)
  if (!mostrarToast) {
    throw new Error('useToast deve ser usado dentro de ToastProvider')
  }
  return mostrarToast
}