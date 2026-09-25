import { Gift } from 'lucide-react'
import { useEffect, useState } from 'react'
import { StaffScanBar } from '../components/StaffScanBar'
import { StudentCredential } from '../components/StudentCredential'
import { useCodeScanner } from '../hooks/useCodeScanner'
import { notifyError, notifySuccess } from '../lib/alert'
import { api, asStudentProfile, extractStudentId, fetchStoreList, fetchStudents } from '../lib/api'
import { findStudentByCode } from '../lib/nfc'

export function RedeemPage({ token }) {
  const [code, setCode] = useState('')
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

  const { videoRef, scanning, scanError, scanHint, startCamera, startNfc, canDetectQr } = useCodeScanner((next) => {
    setCode(next)
    lookup(next)
  })

  useEffect(() => {
    fetchStudents(token, { force: true }).then(setStudents).catch((err) => notifyError('No se pudieron cargar los estudiantes', err.message))
    fetchStoreList(token).then(setStore).catch(() => setStore([]))
  }, [token])

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
      <p className="muted">Escanea el QR o NFC, o escribe el código.</p>
      <StaffScanBar
        videoRef={videoRef}
        scanning={scanning}
        canDetectQr={canDetectQr}
        onScanQr={startCamera}
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
          <label>
            Cantidad
            <input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} />
          </label>
          <div className="staff-products">
            {store.map((item) => (
              <article key={item.id} className="shop-card">
                <Gift size={22} />
                <h3>{item.product}</h3>
                <p>
                  {item.cost} pts · stock {item.quantity}
                </p>
                <button className="dash-cta" type="button" disabled={busy || Number(item.quantity) < 1} onClick={() => redeem(item)}>
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
