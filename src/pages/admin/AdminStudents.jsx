import { Plus, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { FilterableTable } from '../../components/FilterableTable'
import { notifyError, notifySuccess } from '../../lib/alert'
import { createStudentRecord, fetchStudents } from '../../lib/api'

const emptyStudent = {
  enrollment_number: '',
  card_number: '',
}

export function AdminStudents() {
  const { token } = useOutletContext()
  const [students, setStudents] = useState([])
  const [form, setForm] = useState(emptyStudent)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  async function loadStudents() {
    const list = await fetchStudents(token, { force: true })
    setStudents(list)
  }

  useEffect(() => {
    loadStudents().catch((err) => notifyError('No se pudieron cargar los estudiantes', err.message))
  }, [token])

  async function saveStudent(event) {
    event.preventDefault()
    setSaving(true)
    try {
      await createStudentRecord(form, token)
      setForm(emptyStudent)
      setOpen(false)
      await loadStudents()
      await notifySuccess('Estudiante creado')
    } catch (err) {
      await notifyError('No se pudo crear', err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <section className="dash-card dash-table-wrap">
        <div className="dash-card-head">
          <h3>Estudiantes</h3>
          <button
            type="button"
            className="dash-cta"
            onClick={() => {
              setForm(emptyStudent)
              setOpen(true)
            }}
          >
            <Plus size={16} /> Añadir estudiante
          </button>
        </div>
        <FilterableTable
          rows={students}
          rowKey={(row) => row.enrollment_number || row.student_id || row.id}
          emptyText="No hay estudiantes."
          columns={[
            { key: 'enrollment_number', label: 'Matrícula', className: 'dash-mono' },
            {
              key: 'card_number',
              label: 'NFC',
              className: 'dash-mono',
              value: (row) => row.card_number || row.nfc_id,
            },
            {
              key: 'id',
              label: 'ID',
              className: 'dash-mono',
              value: (row) => row.student_id || row.id,
            },
            { key: 'points', label: 'Puntos', type: 'number', value: (row) => Number(row.points || 0) },
          ]}
        />
      </section>

      {open ? (
        <div className="dash-modal-bg" onClick={() => setOpen(false)}>
          <form className="dash-card dash-modal" onClick={(e) => e.stopPropagation()} onSubmit={saveStudent}>
            <div className="dash-card-head">
              <h3>Nuevo estudiante</h3>
              <button type="button" className="dash-icon-btn" onClick={() => setOpen(false)} aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>
            <label>
              Matrícula
              <input
                value={form.enrollment_number}
                onChange={(e) => setForm({ ...form, enrollment_number: e.target.value })}
                placeholder="A0 / L0"
                required
              />
            </label>
            <label>
              Tarjeta NFC
              <input
                value={form.card_number}
                onChange={(e) => setForm({ ...form, card_number: e.target.value })}
                required
              />
            </label>
            <div className="dash-modal-actions">
              <button type="button" onClick={() => setOpen(false)}>
                Cancelar
              </button>
              <button className="dash-cta" disabled={saving} type="submit">
                {saving ? 'Creando…' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  )
}
