import { ShoppingBag } from 'lucide-react'
import { useEffect, useState } from 'react'
import { fetchStoreList } from '../lib/api'

export function Shop({ student }) {
  const [items, setItems] = useState([])

  useEffect(() => {
    fetchStoreList()
      .then(setItems)
      .catch(() => setItems([]))
  }, [])

  return (
    <section className="page shop-page">
      <div className="saldo-bar">
        <span>Tu saldo</span>
        <strong>{student?.staff ? '∞' : `${student?.points ?? 0} pts`}</strong>
      </div>
      <p className="shop-note">Para canjear, ve a la tienda del evento.</p>
      <div className="shop-grid">
        {items.map((item) => (
          <article key={item.id} className="shop-card">
            <ShoppingBag size={16} strokeWidth={1.8} />
            <h3>{item.product}</h3>
            <p>{item.cost} pts</p>
          </article>
        ))}
      </div>
    </section>
  )
}
