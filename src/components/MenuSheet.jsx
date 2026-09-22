import { Bell, LogOut, X } from 'lucide-react'

export function MenuSheet({ open, onClose, onRequestNotify, onCheckout, attendee }) {
  if (!open) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>Menú</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>
        <button type="button" className="sheet-item" onClick={onRequestNotify}>
          <Bell size={18} /> Notificaciones
        </button>
        {attendee ? (
          <button type="button" className="sheet-item" onClick={onCheckout}>
            <LogOut size={18} /> Salir
          </button>
        ) : null}
      </div>
    </div>
  )
}
