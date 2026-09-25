import { ChevronDown, ChevronUp } from 'lucide-react'
import { useMemo, useState } from 'react'

function cellValue(column, row) {
  if (typeof column.value === 'function') return column.value(row)
  const raw = row?.[column.key]
  return raw == null ? '' : raw
}

function asSearchText(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function compareValues(a, b, type) {
  if (type === 'number') return Number(a || 0) - Number(b || 0)
  return String(a ?? '').localeCompare(String(b ?? ''), 'es', { numeric: true, sensitivity: 'base' })
}

export function FilterableTable({ columns, rows, rowKey, rowClassName, emptyText = 'No hay registros.' }) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [sortKey, setSortKey] = useState('')
  const [sortDir, setSortDir] = useState('asc')

  const filtered = useMemo(() => {
    const needle = asSearchText(query)
    const next = rows.filter((row) => {
      if (!needle) return true
      return columns.some((column) => {
        if (column.searchable === false) return false
        return asSearchText(cellValue(column, row)).includes(needle)
      })
    })
    const column = columns.find((item) => item.key === sortKey)
    if (!column || column.sortable === false) return next
    return [...next].sort((a, b) => {
      const result = compareValues(cellValue(column, a), cellValue(column, b), column.type)
      return sortDir === 'desc' ? -result : result
    })
  }, [columns, query, rows, sortDir, sortKey])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pageCount - 1)
  const start = filtered.length ? currentPage * pageSize : 0
  const visible = filtered.slice(start, start + pageSize)
  const end = start + visible.length

  function changeQuery(value) {
    setQuery(value)
    setPage(0)
  }

  function toggleSort(column) {
    if (column.sortable === false) return
    if (sortKey === column.key) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(column.key)
      setSortDir('asc')
    }
  }

  return (
    <div className="dt">
      <div className="dt-toolbar">
        <label className="dt-size">
          Mostrar
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value))
              setPage(0)
            }}
          >
            {[10, 25, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          registros
        </label>
        <label className="dt-search">
          Buscar
          <input
            value={query}
            onChange={(e) => changeQuery(e.target.value)}
            placeholder="Filtrar tabla…"
          />
        </label>
      </div>

      <table>
        <thead>
          <tr>
            {columns.map((column) => {
              const active = sortKey === column.key
              const sortable = column.sortable !== false
              return (
                <th key={column.key || column.label}>
                  {sortable ? (
                    <button type="button" className="dt-sort" onClick={() => toggleSort(column)}>
                      <span>{column.label}</span>
                      {active ? sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} /> : null}
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {visible.length ? (
            visible.map((row, index) => (
              <tr key={rowKey ? rowKey(row, index) : index} className={rowClassName ? rowClassName(row) : undefined}>
                {columns.map((column) => (
                  <td key={column.key || column.label} className={typeof column.className === 'function' ? column.className(row) : column.className}>
                    {column.render ? column.render(row) : cellValue(column, row) || '—'}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="dt-empty">
                {query ? 'No se encontraron resultados.' : emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="dt-foot">
        <p>
          {filtered.length
            ? `Mostrando ${start + 1} a ${end} de ${filtered.length} registros`
            : 'Mostrando 0 registros'}
          {query && filtered.length !== rows.length ? ` (filtrado de ${rows.length})` : ''}
        </p>
        <div className="dt-pages">
          <button type="button" disabled={currentPage === 0} onClick={() => setPage(0)}>
            Primero
          </button>
          <button type="button" disabled={currentPage === 0} onClick={() => setPage((n) => Math.max(0, n - 1))}>
            Anterior
          </button>
          <span>
            Página {currentPage + 1} de {pageCount}
          </span>
          <button
            type="button"
            disabled={currentPage >= pageCount - 1}
            onClick={() => setPage((n) => Math.min(pageCount - 1, n + 1))}
          >
            Siguiente
          </button>
          <button
            type="button"
            disabled={currentPage >= pageCount - 1}
            onClick={() => setPage(pageCount - 1)}
          >
            Último
          </button>
        </div>
      </div>
    </div>
  )
}
