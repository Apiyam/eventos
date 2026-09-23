import { Check } from 'lucide-react'
import { useEffect } from 'react'

export function CheckInModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return undefined
    const id = setTimeout(onClose, 4000)
    return () => clearTimeout(id)
  }, [open, onClose])

  if (!open) return null
  return (
    <button type="button" className="checkin-ok" onClick={onClose} aria-label="Cerrar">
      <div className="checkin-ok-card">
        <span className="checkin-ok-icon">
          <Check size={72} strokeWidth={2.4} />
        </span>
        <h2>Registro a plática aceptada</h2>
      </div>
    </button>
  )
}
