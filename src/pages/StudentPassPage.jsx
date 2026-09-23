import { LogOut } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { fetchStoreCatalog, fetchStudentTalks, fetchTalks } from '../lib/api'
import { publicNfcUrl, qrImageUrl } from '../lib/nfc'
import { formatTime } from '../lib/time'

export function StudentPassPage({ student, onCheckout }) {
  const [talks, setTalks] = useState([])
  const [products, setProducts] = useState([])
  const [talkIds, setTalkIds] = useState(() => (student?.talk_ids || []).map(String))

  const card = student.card_number || student.nfc_id || student.enrollment_number
  const passUrl = publicNfcUrl(card)

  useEffect(() => {
    fetchTalks()
      .then(setTalks)
      .catch(() => setTalks([]))
    fetchStoreCatalog()
      .then(setProducts)
      .catch(() => setProducts([]))
    fetchStudentTalks(student)
      .then(setTalkIds)
      .catch(() => {})
  }, [student])

  const history = useMemo(
    () => talks.filter((talk) => talkIds.includes(talk.id)).sort((a, b) => a.start.localeCompare(b.start)),
    [talkIds, talks],
  )

  return (
    <div className="app-frame pass-frame">
      <header className="pass-top">
        <button type="button" className="logo" disabled>
          <img src="/landing/mostla-header.png" alt="MOSTLA DAY" />
        </button>
        <button type="button" className="text-btn" onClick={onCheckout}>
          <LogOut size={16} /> Salir
        </button>
      </header>

      <section className="page pass-screen">
        <article className="pass-hero">
          <img src={qrImageUrl(passUrl, 240)} alt={`QR ${card}`} />
          <p className="pass-points">
            <span>Puntos</span>
            <strong>{student.points ?? 0}</strong>
          </p>
          <p className="pass-nfc">{card || 'Sin NFC'}</p>
          <p className="pass-enroll">{student.enrollment_number}</p>
        </article>

        <section className="pass-block">
          <h2>Pláticas</h2>
          {history.length ? (
            <ul className="staff-history">
              {history.map((talk) => (
                <li key={talk.id}>
                  <strong>{talk.title}</strong>
                  <span>{formatTime(talk.start)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Todavía no tienes pláticas registradas.</p>
          )}
        </section>

        <section className="pass-block">
          <h2>Productos a canjear</h2>
          <p className="muted">Solo informativo. El canje se hace en la tienda del evento.</p>
          <div className="shop-grid">
            {products.map((item) => (
              <article key={item.id} className="shop-card">
                <h3>{item.product}</h3>
                <p>{item.cost} pts</p>
              </article>
            ))}
          </div>
        </section>
      </section>
    </div>
  )
}
