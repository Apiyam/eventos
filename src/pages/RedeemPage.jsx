import { Gift } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { StaffScanBar } from '../components/StaffScanBar'
import { StudentCredential } from '../components/StudentCredential'
import { useCodeScanner } from '../hooks/useCodeScanner'
import { notifyError, notifySuccess } from '../lib/alert'
import { api, asStudentProfile, extractStudentId, fetchStoreList, fetchStudents } from '../lib/api'
import { findStudentByCode, normalizeScanCode } from '../lib/nfc'

export function RedeemPage({ token }) {
  const [params] = useSearchParams()
  const preset = normalizeScanCode(params.get('code') || params.get('nfc') || '')
  const [code, setCode] = useState(preset)
  const [students, setStudents] = useState([])
  const [store, setStore] = useState([])
  const [profile, setProfile] = useState(null)
  const [qty, setQty] = useState(1)
  const [busy, setBusy] = useState(false)

  function lookup(raw, list = students) {
    const found = findStudentByCode(list, raw || code)
    if (!found) {
      setProfile(null)
      notifyError('No encontrado', 'No hay un estudiante con ese NFC o código.')
      return
    }
    if (!extractStudentId(found)) {
      setProfile(found)
      notifyError('Registro incompleto', 'Este registro no tiene student_id.')
      return
    }
    setCode(raw || code)
    setProfile(found)
  }

  const { videoRef, scanning, scanError, scanHint, startCamera, stopCamera, startNfc } = useCodeScanner((next) => {
    setCode(next)
    lookup(next)
  })

  useEffect(() => {
    let cancelled = false
    fetchStudents(token, { force: true })
      .then((list) => {
        if (cancelled) return
        setStudents(list)
        if (preset) lookup(preset, list)
      })
      .catch((err) => {
        if (!cancelled) notifyError('No se pudieron cargar los estudiantes', err.message)
      })
    fetchStoreList(token)
      .then((list) => {
        if (!cancelled) setStore(list)
      })
      .catch(() => {
        if (!cancelled) setStore([])
      })
    return () => {
      cancelled = true
    }
  }, [token, preset])

  async function redeem(product) {
    if (!profile) return
    const studentId = extractStudentId(profile)
    const amount = Math.max(1, Number(qty) || 1)
    const cost = Number(product.cost || 0) * amount
    const points = Number(profile.points || 0)
    if (!profile.staff && points < cost) {
      notifyError('Saldo insuficiente')
      return
    }
    setBusy(true)
    try {
      await api(`/store/${product.id}`, {
        token,
        method: 'PATCH',
        body: {
          id_product: product.id,
          quantity_bought: amount,
          id_user: studentId,
          current_points_user: points,
        },
      })
      const remaining = profile.staff ? points : Math.max(0, points - cost)
      const next = asStudentProfile({ ...profile, points: remaining })
      setProfile(next)
      setStudents((current) => current.map((row) => (row.student_id === studentId ? next : row)))
      setStore((current) =>
        current.map((row) =>
          row.id === product.id ? { ...row, quantity: Math.max(0, Number(row.quantity || 0) - amount) } : row,
        ),
      )
      await notifySuccess('Canje listo', product.product)
    } catch (err) {
      await notifyError('No se pudo canjear', err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="dash-card staff-panel">
      <h3>Canje de regalos</h3>
      <p className="muted">En el celular pulsa Escanear QR, acepta la cámara y apunta al código del estudiante.</p>
      <StaffScanBar
        videoRef={videoRef}
        scanning={scanning}
        onScanQr={startCamera}
        onStopQr={stopCamera}
        onScanNfc={startNfc}
      />
      <form
        className="staff-lookup"
        onSubmit={(event) => {
          event.preventDefault()
          lookup()
        }}
      >
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="NFC, QR o matrícula"
          autoCapitalize="characters"
        />
        <button className="dash-cta" type="submit">
          Buscar
        </button>
      </form>
      {scanError ? <p className="muted">{scanError}</p> : null}
      {scanHint ? <p className="muted">{scanHint}</p> : null}

      {profile ? <StudentCredential student={profile} /> : null}

      {profile ? (
        <>
          <label className="staff-qty">
            Cantidad
            <input type="number" min="1" inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} />
          </label>
          <div className="staff-products">
            {store.map((item) => (
              <article key={item.id} className="shop-card staff-product">
                <Gift size={20} />
                <div className="staff-product-copy">
                  <h3>{item.product}</h3>
                  <p>
                    {item.cost} pts · stock {item.quantity}
                  </p>
                </div>
                <button
                  className="dash-cta"
                  type="button"
                  disabled={busy || Number(item.quantity) < 1 || (!profile.staff && Number(profile.points || 0) < Number(item.cost || 0) * Math.max(1, Number(qty) || 1))}
                  onClick={() => redeem(item)}
                >
                  Canjear
                </button>
              </article>
            ))}
          </div>
        </>
      ) : null}
    </section>
  )
}
