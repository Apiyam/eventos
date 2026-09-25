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
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  async function loadStore() {
    setStore(await fetchStoreList(token))
  }

  useEffect(() => {
    loadStore().catch((err) => notifyError('No se pudo cargar la tienda', err.message))
  }, [token])

  async function saveProduct(event) {
    event.preventDefault()
    setSaving(true)
    try {
      await api('/store', { token, method: 'POST', body: form })
      setForm(emptyProduct)
      setOpen(false)
      await loadStore()
      await notifySuccess('Producto creado')
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
          <h3>Tienda</h3>
          <button
            type="button"
            className="dash-cta"
            onClick={() => {
              setForm(emptyProduct)
              setOpen(true)
            }}
          >
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
          ]}
        />
      </section>

      {open ? (
        <div className="dash-modal-bg" onClick={() => setOpen(false)}>
          <form className="dash-card dash-modal" onClick={(e) => e.stopPropagation()} onSubmit={saveProduct}>
            <div className="dash-card-head">
              <h3>Nuevo producto</h3>
              <button type="button" className="dash-icon-btn" onClick={() => setOpen(false)} aria-label="Cerrar">
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
