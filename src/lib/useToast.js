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
    <>
      {toast && (
        <div style={{ position: 'fixed', bottom: 20, right: 20, background: '#fff', border: '0.5px solid #d1d5db', borderRadius: 8, padding: '10px 16px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, zIndex: 300 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: toast.type === 'error' ? '#dc2626' : '#16a34a' }} />
          {toast.msg}
        </div>
      )}
    </>
  )
}
