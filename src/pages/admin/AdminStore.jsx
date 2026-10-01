import { Plus, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { FilterableTable } from '../../components/FilterableTable'
import { notifyError, notifySuccess } from '../../lib/alert'
import { api, fetchStoreList } from '../../lib/api'

const emptyProduct = { product: '', cost: 20, quantity: 10 }

export function AdminStore() {
  const { token } = useOutletContext()
  const [store, setStore] = useState([])
  const [form, setForm] = useState(emptyProduct)
  const [editingId, setEditingId] = useState(null)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  async function loadStore() {
    setStore(await fetchStoreList(token))
  }

  useEffect(() => {
    loadStore().catch((err) => notifyError('No se pudo cargar la tienda', err.message))
  }, [token])

  function close() {
    setOpen(false)
    setEditingId(null)
    setForm(emptyProduct)
  }

  function openCreate() {
    setEditingId(null)
    setForm(emptyProduct)
    setOpen(true)
  }

  function openEdit(row) {
    setEditingId(row.id)
    setForm({
      product: row.product || row.name || '',
      cost: row.cost ?? 0,
      quantity: row.quantity ?? 0,
    })
    setOpen(true)
  }

  async function saveProduct(event) {
    event.preventDefault()
    setSaving(true)
    try {
      if (editingId) {
        await api(`/store/${editingId}/details`, {
          token,
          method: 'PATCH',
          body: {
            product: form.product,
            cost: Number(form.cost),
            quantity: Number(form.quantity),
          },
        })
      } else {
        await api('/store', { token, method: 'POST', body: form })
      }
      close()
      await loadStore()
      await notifySuccess(editingId ? 'Producto actualizado' : 'Producto creado')
    } catch (err) {
      await notifyError('No se pudo guardar', err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <section className="dash-card dash-table-wrap">
        <div className="dash-card-head">
          <h3>Tienda</h3>
          <button type="button" className="dash-cta" onClick={openCreate}>
            <Plus size={16} /> Añadir producto
          </button>
        </div>
        <FilterableTable
          rows={store}
          rowKey={(row) => row.id}
          emptyText="No hay productos."
          columns={[
            { key: 'product', label: 'Producto', value: (row) => row.product || row.name },
            { key: 'cost', label: 'Costo', type: 'number' },
            { key: 'quantity', label: 'Cantidad', type: 'number' },
            {
              key: 'actions',
              label: '',
              sortable: false,
              searchable: false,
              className: 'dash-actions',
              render: (row) => (
                <button type="button" onClick={() => openEdit(row)}>
                  Editar
                </button>
              ),
            },
          ]}
        />
      </section>

      {open ? (
        <div className="dash-modal-bg" onClick={close}>
          <form className="dash-card dash-modal" onClick={(e) => e.stopPropagation()} onSubmit={saveProduct}>
            <div className="dash-card-head">
              <h3>{editingId ? 'Editar producto' : 'Nuevo producto'}</h3>
              <button type="button" className="dash-icon-btn" onClick={close} aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>
            <label>
              Producto
              <input value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} required />
            </label>
            <label>
              Costo (puntos)
              <input type="number" min="1" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} required />
            </label>
            <label>
              Cantidad
              <input type="number" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
            </label>
            <div className="dash-modal-actions">
              <button type="button" onClick={close}>
                Cancelar
              </button>
              <button className="dash-cta" disabled={saving} type="submit">
                {saving ? 'Guardando…' : editingId ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  )
}
