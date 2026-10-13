import { formatTime } from '../lib/time'

export function groupTalkActivations(activations, talks) {
  const groups = []
  const index = new Map()
  for (const row of activations) {
    const id = String(row.talkId || '')
    if (!id) continue
    if (!index.has(id)) {
      const talk = talks.find((item) => item.id === id || String(item.rawId) === id)
      const group = { id, talk, items: [] }
      index.set(id, group)
      groups.push(group)
    }
    index.get(id).items.push(row)
  }
  return groups
}

export function ActivationGroups({ activations, talks, empty }) {
  const groups = groupTalkActivations(activations, talks)
  if (!groups.length) return <p className="muted">{empty}</p>
  return (
    <div className="activation-list">
      {groups.map((group) => (
        <details key={group.id} className="activation-acc">
          <summary>
            <span>
              <strong>{group.talk?.title || 'Plática'}</strong>
              <small>{group.talk ? formatTime(group.talk.start) : ''}</small>
            </span>
            <em>
              {group.items.length} {group.items.length === 1 ? 'activación' : 'activaciones'}
            </em>
          </summary>
          <ol>
            {group.items.map((item, i) => (
              <li key={`${group.id}-${item.index ?? i}`}>
                Activación {i + 1}
                {item.at ? <span>{item.at}</span> : null}
              </li>
            ))}
          </ol>
        </details>
      ))}
    </div>
  )
}
