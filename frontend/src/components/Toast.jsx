import { useEffect, useRef, useState } from 'react'

import { ToastContext } from './toastContext'

export function ToastProvider({ children }) {
  const [mensagem, setMensagem] = useState('')
  const temporizador = useRef(null)

  useEffect(() => () => window.clearTimeout(temporizador.current), [])

  function mostrarToast(texto = 'Salvo') {
    window.clearTimeout(temporizador.current)
    setMensagem(texto)
    temporizador.current = window.setTimeout(() => setMensagem(''), 6000)
  }

  return (
    <ToastContext.Provider value={mostrarToast}>
      {children}
      {mensagem && (
        <div className="toast-notice" role="status" aria-live="polite">
          <span className="toast-check" aria-hidden="true">✓</span>
          {mensagem}
        </div>
      )}
    </ToastContext.Provider>
  )
}