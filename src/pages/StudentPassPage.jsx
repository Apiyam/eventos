import { CalendarDays, ChevronDown, LogOut, ShoppingBag, Ticket } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { fetchStoreList, fetchStudentTalks, fetchTalks } from '../lib/api'
import { publicNfcUrl, qrImageUrl } from '../lib/nfc'
import { formatTime } from '../lib/time'

function PassList({ items, empty, loaded }) {
  return (
    <ul className="pass-list">
      {items.length ? (
        items.map((item) => (
          <li key={item.id}>
            <strong>{item.title}</strong>
            <span>{item.meta}</span>
          </li>
        ))
      ) : (
        <li className="is-empty">
          <strong>{loaded ? empty : 'Cargando…'}</strong>
        </li>
      )}
    </ul>
  )
}

export function StudentPassPage({ student, onCheckout }) {
  const [talks, setTalks] = useState([])
  const [mineIds, setMineIds] = useState(() => (student.talk_ids || []).map(String))
  const [agendaOpen, setAgendaOpen] = useState(false)
  const [mineOpen, setMineOpen] = useState(false)
  const [storeOpen, setStoreOpen] = useState(false)
  const [catalogLoaded, setCatalogLoaded] = useState(false)
  const [mineLoaded, setMineLoaded] = useState(false)
  const [products, setProducts] = useState([])
  const [storeLoaded, setStoreLoaded] = useState(false)

  const card = student.card_number || student.nfc_id || student.enrollment_number
  const passUrl = publicNfcUrl(card)

  useEffect(() => {
    if ((!agendaOpen && !mineOpen) || catalogLoaded) return undefined
    let cancelled = false
    fetchTalks()
      .then((list) => {
        if (!cancelled) setTalks(list)
      })
      .catch(() => {
        if (!cancelled) setTalks([])
      })
      .finally(() => {
        if (!cancelled) setCatalogLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [agendaOpen, catalogLoaded, mineOpen])

  useEffect(() => {
    if (!mineOpen || mineLoaded) return undefined
    let cancelled = false
    fetchStudentTalks(student)
      .then((ids) => {
        if (!cancelled) setMineIds(ids.map(String))
      })
      .catch(() => {
        if (!cancelled) setMineIds((student.talk_ids || []).map(String))
      })
      .finally(() => {
        if (!cancelled) setMineLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [mineLoaded, mineOpen, student])

  useEffect(() => {
    if (!storeOpen || storeLoaded) return undefined
    let cancelled = false
    fetchStoreList()
      .then((list) => {
        if (!cancelled) setProducts(list)
      })
      .catch(() => {
        if (!cancelled) setProducts([])
      })
      .finally(() => {
        if (!cancelled) setStoreLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [storeLoaded, storeOpen])

  const agenda = useMemo(
    () => [...talks].sort((a, b) => String(a.start).localeCompare(String(b.start))),
    [talks],
  )
  const mine = useMemo(() => {
    const ids = new Set(mineIds.map(String))
    return agenda.filter((talk) => ids.has(String(talk.id)) || ids.has(String(talk.rawId)))
  }, [agenda, mineIds])

  return (
    <div className="app-frame pass-frame">
      <header className="pass-top">
        <button type="button" className="logo" disabled>
          <img src="/landing/mostla-header.png" alt="MOSTLA DAY" />
        </button>
        <button type="button" className="pass-out" onClick={onCheckout}>
          <LogOut size={16} /> Salir
        </button>
      </header>

      <section className="page pass-screen">
        <article className="pass-hero">
          <div className="pass-main">
            <div className="pass-qr">
              <img src={qrImageUrl(passUrl, 240)} alt={`QR ${card}`} />
            </div>
            <div className="pass-score">
              <strong>{student.points ?? 0}</strong>
              <span>Puntos</span>
            </div>
          </div>
          <dl className="pass-meta">
            <div>
              <dt>NFC</dt>
              <dd>{card || 'Sin NFC'}</dd>
            </div>
            <div>
              <dt>Matrícula</dt>
              <dd>{student.enrollment_number || '—'}</dd>
            </div>
          </dl>
        </article>

        <section className="pass-selectors">
          <div className={`pass-panel ${agendaOpen ? 'is-open' : ''}`}>
            <button
              type="button"
              className={`pass-accordion is-agenda ${agendaOpen ? 'is-open' : ''}`}
              onClick={() => setAgendaOpen((open) => !open)}
            >
              <i className="pass-acc-icon">
                <CalendarDays size={18} />
              </i>
              <span className="pass-acc-copy">
                <strong>Agenda</strong>
                <small>Todas las charlas del día</small>
              </span>
              <ChevronDown size={18} />
            </button>
            {agendaOpen ? (
              <PassList
                loaded={catalogLoaded}
                empty="No hay charlas en la agenda."
                items={agenda.map((talk) => ({ id: talk.id, title: talk.title, meta: formatTime(talk.start) }))}
              />
            ) : null}
          </div>

          <div className={`pass-panel ${mineOpen ? 'is-open' : ''}`}>
            <button
              type="button"
              className={`pass-accordion is-mine ${mineOpen ? 'is-open' : ''}`}
              onClick={() => setMineOpen((open) => !open)}
            >
              <i className="pass-acc-icon">
                <Ticket size={18} />
              </i>
              <span className="pass-acc-copy">
                <strong>Mis charlas</strong>
                <small>Donde ya eres asistente</small>
              </span>
              <ChevronDown size={18} />
            </button>
            {mineOpen ? (
              <PassList
                loaded={mineLoaded && catalogLoaded}
                empty="Aún no estás registrado en ninguna charla."
                items={mine.map((talk) => ({ id: talk.id, title: talk.title, meta: formatTime(talk.start) }))}
              />
            ) : null}
          </div>

          <div className={`pass-panel ${storeOpen ? 'is-open' : ''}`}>
            <button
              type="button"
              className={`pass-accordion is-store ${storeOpen ? 'is-open' : ''}`}
              onClick={() => setStoreOpen((open) => !open)}
            >
              <i className="pass-acc-icon">
                <ShoppingBag size={18} />
              </i>
              <span className="pass-acc-copy">
                <strong>Productos</strong>
                <small>Catálogo informativo</small>
              </span>
              <ChevronDown size={18} />
            </button>
            {storeOpen ? (
              <PassList
                loaded={storeLoaded}
                empty="No hay productos disponibles."
                items={products.map((item) => ({
                  id: item.id,
                  title: item.product || item.name,
                  meta: `${item.cost} pts`,
                }))}
              />
            ) : null}
          </div>
        </section>
      </section>
    </div>
  )
}
