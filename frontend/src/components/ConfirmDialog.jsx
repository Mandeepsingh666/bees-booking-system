import React from 'react'

export default function ConfirmDialog({ isOpen, title, message, confirmLabel = 'Confirm', confirmClass = 'btn-danger', onConfirm, onCancel, children }) {
  if (!isOpen) return null
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-box" onClick={e => e.stopPropagation()}>
        <h4>{title}</h4>
        <p>{message}</p>
        {children}
        <div className="confirm-actions">
          <button className="btn btn-outline btn-sm" onClick={onCancel}>Cancel</button>
          <button className={`btn ${confirmClass} btn-sm`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
