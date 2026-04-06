import { useState, useCallback } from 'react'

export function useToast() {
  const [toast, setToast] = useState(null)
  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }, [])
  return { toast, showToast }
}

export function Toast({ toast }) {
  if (!toast) return null
  return (
    <div className="toast">
      <div className="toast-dot" style={{ background: toast.type === 'error' ? '#dc2626' : '#16a34a' }} />
      {toast.msg}
    </div>
  )
}
