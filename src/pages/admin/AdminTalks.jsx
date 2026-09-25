import { Plus, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { DateTimePicker } from '../../components/DateTimePicker'
import { FilterableTable } from '../../components/FilterableTable'
import { confirmAction, notifyError, notifySuccess } from '../../lib/alert'
import { api, imageUrl, unwrapImagePath, unwrapList } from '../../lib/api'
import { publicNfcUrl } from '../../lib/nfc'

const emptyTalk = {
  name: '',
  speaker: '',
  start_time: '2026-10-13 10:00:00',
  duration: 45,
  benefit: 20,
  max_forum: 100,
  url_nfc: '',
  image_path: '',
}

function makeNfcUrl() {
  const hex = crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()
  return publicNfcUrl(`${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`)
}

export function AdminTalks() {
  const { token } = useOutletContext()
  const [talks, setTalks] = useState([])
  const [form, setForm] = useState(emptyTalk)
  const [talkModal, setTalkModal] = useState(false)
  const [editingTalkId, setEditingTalkId] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [saving, setSaving] = useState(false)

  async function loadTalks() {
    const res = await api('/talks', { token })
    setTalks(unwrapList(res))
  }

  useEffect(() => {
    loadTalks().catch((err) => notifyError('No se pudieron cargar las charlas', err.message))
  }, [token])

  function closeTalkModal() {
    setTalkModal(false)
    setEditingTalkId(null)
    setImageFile(null)
    setImagePreview('')
  }

  function openCreateTalk() {
    setEditingTalkId(null)
    setForm({ ...emptyTalk, url_nfc: makeNfcUrl() })
    setImageFile(null)
    setImagePreview('')
    setTalkModal(true)
  }

  function openEditTalk(talk) {
    setEditingTalkId(talk.id)
    setForm({
      name: talk.name || '',
      speaker: talk.speaker || talk.company || '',
      start_time: talk.start_time || emptyTalk.start_time,
      duration: talk.duration ?? 45,
      benefit: talk.benefit ?? 20,
      max_forum: talk.max_forum ?? 100,
      url_nfc: talk.url_nfc || '',
      image_path: talk.image_path || '',
    })
    setImageFile(null)
    setImagePreview(talk.image_path ? imageUrl(talk.image_path) : '')
    setTalkModal(true)
  }

  async function saveTalk(event) {
    event.preventDefault()
    setSaving(true)
    try {
      let image_path = form.image_path || ''
      if (imageFile) {
        const payload = new FormData()
        payload.append('image', imageFile)
        const uploaded = await api('/images', { token, method: 'POST', form: true, body: payload })
        image_path = unwrapImagePath(uploaded)
        if (!image_path) throw new Error('La API no devolvió la ruta de la imagen')
      }
      const payload = {
        name: form.name,
        speaker: form.speaker,
        company: form.speaker,
        start_time: form.start_time,
        duration: form.duration,
        benefit: form.benefit,
        max_forum: form.max_forum,
        url_nfc: form.url_nfc,
        image_path,
      }
      if (editingTalkId) {
        await api(`/talks/${editingTalkId}`, { token, method: 'PUT', body: payload })
      } else {
        await api('/talks', { token, method: 'POST', body: payload })
      }
      closeTalkModal()
      await loadTalks()
      await notifySuccess(editingTalkId ? 'Charla actualizada' : 'Charla creada')
    } catch (err) {
      await notifyError('No se pudo guardar', err.message)
    } finally {
      setSaving(false)
    }
  }

  async function removeTalk(id) {
    if (!(await confirmAction('¿Eliminar esta charla?'))) return
    try {
      await api(`/talks/${id}`, { token, method: 'DELETE' })
      await loadTalks()
      await notifySuccess('Charla eliminada')
    } catch (err) {
      await notifyError('No se pudo eliminar', err.message)
    }
  }

  return (
    <>
      <section className="dash-card dash-table-wrap">
        <div className="dash-card-head">
          <h3>Charlas</h3>
          <button type="button" className="dash-cta" onClick={openCreateTalk}>
            <Plus size={16} /> Añadir charla
          </button>
        </div>
        <FilterableTable
          rows={talks}
          rowKey={(talk) => talk.id}
          emptyText="No hay charlas."
          columns={[
            { key: 'name', label: 'Nombre' },
            {
              key: 'image_path',
              label: 'Imagen',
              sortable: false,
              searchable: false,
              render: (talk) =>
                talk.image_path ? <img className="dash-thumb" src={imageUrl(talk.image_path)} alt="" /> : '—',
            },
            { key: 'speaker', label: 'Ponente', value: (talk) => talk.speaker || talk.company },
            { key: 'start_time', label: 'Inicio' },
            { key: 'duration', label: 'Min', type: 'number' },
            {
              key: 'cupo',
              label: 'Cupo',
              type: 'number',
              value: (talk) => Number(talk.enrolled_count || 0),
              render: (talk) => `${talk.enrolled_count || 0}/${talk.max_forum}`,
            },
            { key: 'benefit', label: 'Puntos', type: 'number' },
            {
              key: 'actions',
              label: '',
              sortable: false,
              searchable: false,
              className: 'dash-actions',
              render: (talk) => (
                <>
                  <button type="button" onClick={() => openEditTalk(talk)}>
                    Editar
                  </button>
                  <button type="button" onClick={() => removeTalk(talk.id)}>
                    Eliminar
                  </button>
                </>
              ),
            },
          ]}
        />
      </section>

      {talkModal ? (
        <div className="dash-modal-bg" onClick={closeTalkModal}>
          <form className="dash-card dash-modal" onClick={(e) => e.stopPropagation()} onSubmit={saveTalk}>
            <div className="dash-card-head">
              <h3>{editingTalkId ? 'Editar charla' : 'Nueva charla'}</h3>
              <button type="button" className="dash-icon-btn" onClick={closeTalkModal} aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>
            <label>
              Nombre
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </label>
            <label>
              Ponente
              <input value={form.speaker} onChange={(e) => setForm({ ...form, speaker: e.target.value })} />
            </label>
            <label>
              Inicio
              <DateTimePicker value={form.start_time} onChange={(start_time) => setForm({ ...form, start_time })} />
            </label>
            <label>
              Duración (min)
              <input type="number" min="5" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
            </label>
            <label>
              Puntos
              <input type="number" value={form.benefit} onChange={(e) => setForm({ ...form, benefit: e.target.value })} />
            </label>
            <label>
              Cupo
              <input type="number" value={form.max_forum} onChange={(e) => setForm({ ...form, max_forum: e.target.value })} />
            </label>
            <label>
              URL NFC
              <input value={form.url_nfc} readOnly />
            </label>
            <label>
              Imagen
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  setImageFile(file)
                  setImagePreview((current) => {
                    if (current) URL.revokeObjectURL(current)
                    return file ? URL.createObjectURL(file) : ''
                  })
                }}
              />
            </label>
            {imagePreview ? <img className="dash-preview" src={imagePreview} alt="" /> : null}
            <div className="dash-modal-actions">
              <button type="button" onClick={closeTalkModal}>
                Cancelar
              </button>
              <button className="dash-cta" disabled={saving} type="submit">
                {saving ? 'Guardando…' : editingTalkId ? 'Guardar' : 'Publicar'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  )
}
