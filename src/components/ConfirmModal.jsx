export function ConfirmModal({ open, title, message, onConfirm, onCancel, confirmLabel = 'Confirmer', danger = false }) {
  if (!open) return null
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">{title}</div>
        <div className="modal-sub">{message}</div>
        <div className="modal-footer">
          <button className="btn" onClick={onCancel}>Annuler</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
