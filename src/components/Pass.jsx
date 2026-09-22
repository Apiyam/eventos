import { LogOut, Nfc } from 'lucide-react'

export function Pass({ attendee, onOpenRegister, onCheckout }) {
  if (!attendee) {
    return (
      <section className="page">
        <div className="empty-pass">
          <Nfc size={36} strokeWidth={1.6} />
          <h2>Tu pase</h2>
          <button type="button" className="btn" onClick={onOpenRegister}>
            Registrarme
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="page">
      <article className="pass-card">
        <div className="pass-stripe" />
        <div className="pass-chip">
          <Nfc size={22} />
        </div>
        <p>MOSTLA DAY 2026</p>
        <h2>{attendee.name}</h2>
        <p className="pass-email">{attendee.email}</p>
        <p className="pass-id">{attendee.nfcId}</p>
        <p className="pass-saldo">Saldo {attendee.staff ? '∞' : `${attendee.points ?? 0} pts`}</p>
        {attendee.staff ? <p className="pass-staff">Staff</p> : null}
      </article>
      <button type="button" className="text-btn" onClick={onCheckout}>
        <LogOut size={16} /> Salir
      </button>
    </section>
  )
}
