export function Toasts({ items, onDismiss }) {
  if (!items.length) return null
  return (
    <div className="toasts" aria-live="polite">
      {items.map((item) => (
        <article key={item.id} className="toast">
          <div>
            <strong>{item.title}</strong>
            {item.body ? <p>{item.body}</p> : null}
          </div>
          <button type="button" onClick={() => onDismiss(item.id)} aria-label="Cerrar">
            ×
          </button>
        </article>
      ))}
    </div>
  )
}
