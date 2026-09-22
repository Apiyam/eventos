let clerkListJob = null
let clerkListCache = null

function compactNfc(value) {
  return String(value || '').replace(/-/g, '').toUpperCase()
}

function firstEmail(user) {
  const addresses = user?.email_addresses || user?.emailAddresses || []
  return (
    user?.email ||
    user?.email_address ||
    user?.emailAddress ||
    addresses[0]?.email_address ||
    addresses[0]?.emailAddress ||
    ''
  )
}

function clerkMeta(user) {
  return user?.public_metadata || user?.publicMetadata || {}
}

export function normalizeClerkUser(user) {
  if (!user) return null
  const meta = clerkMeta(user)
  const first_name = user.first_name || user.firstName || ''
  const last_name = user.last_name || user.lastName || ''
  const email = firstEmail(user)
  const full_name = [first_name, last_name].filter(Boolean).join(' ') || user.full_name || user.fullName || user.username || email || ''
  const nfc_id = meta.nfc_id || meta.nfc_code || meta.nfc || user.nfc_id || user.nfc_code || ''
  return {
    id: user.id || user.clerk_user_id || '',
    first_name,
    last_name,
    full_name,
    email,
    image_url: user.image_url || user.imageUrl || '',
    nfc_id,
    student_id: meta.student_id ?? user.student_id ?? '',
    staff: Boolean(meta.staff ?? user.staff),
    points: Number(meta.points ?? user.points ?? 0),
    talk_ids: Array.isArray(meta.talk_ids) ? meta.talk_ids.map(String) : Array.isArray(user.talk_ids) ? user.talk_ids.map(String) : [],
    created_at: user.created_at || user.createdAt || '',
  }
}

function unwrapClerkList(res) {
  const list = Array.isArray(res)
    ? res
    : Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res?.users)
        ? res.users
        : []
  return list.map(normalizeClerkUser).filter(Boolean)
}

export function makeNfcId() {
  const hex = crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()
  return `NX-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`
}

export function uniqueNfcId(preferred = '', ownerId = '', users = []) {
  const used = new Set(
    users
      .filter((user) => !ownerId || (user.id || user.clerk_user_id) !== ownerId)
      .map((user) => compactNfc(normalizeClerkUser(user)?.nfc_id || user.nfc_id))
      .filter(Boolean),
  )
  const candidate = String(preferred || '').trim()
  if (candidate && !used.has(compactNfc(candidate))) return candidate
  for (let i = 0; i < 24; i += 1) {
    const nfc = makeNfcId()
    if (!used.has(compactNfc(nfc))) return nfc
  }
  return makeNfcId()
}

export function rememberClerkUsers(users) {
  clerkListCache = Array.isArray(users) ? users : []
  return clerkListCache
}

export function findClerkUser(id, users = clerkListCache || []) {
  return users.find((user) => user.id === id) || null
}

const N8N = String(import.meta.env.VITE_N8N_CLERK_URL || 'https://n8n.srv912585.hstgr.cloud/webhook/mostla-clerk').replace(/\/$/, '')

async function parse(res) {
  const text = await res.text()
  const data = text ? JSON.parse(text) : {}
  if (!res.ok || data.status === false) {
    throw new Error(data.message || `Error ${res.status}`)
  }
  if (!text) {
    throw new Error('n8n respondió vacío. Importa de nuevo n8n/mostla-clerk.json, actívalo y usa respuesta lastNode.')
  }
  return data
}

function n8n(op, extra = {}) {
  if (!N8N) throw new Error('Falta VITE_N8N_CLERK_URL')
  return fetch(N8N, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ op, ...extra }),
  }).then(parse)
}

export function fetchClerkUser(id) {
  const cached = findClerkUser(id)
  if (cached) return Promise.resolve(cached)
  return n8n('get', { id }).then((res) => normalizeClerkUser(res.data || res))
}

export function fetchClerkUsers({ force = false } = {}) {
  if (!force && clerkListCache) return Promise.resolve(clerkListCache)
  if (!force && clerkListJob) return clerkListJob
  clerkListJob = n8n('list')
    .then(unwrapClerkList)
    .then(rememberClerkUsers)
    .finally(() => {
      clerkListJob = null
    })
  return clerkListJob
}

export function verifyClerkEmail(id) {
  return n8n('verify', { id }).then((res) => res.data)
}

export function patchClerkPublic(id, public_metadata) {
  return n8n('patch', { id, public_metadata }).then((res) => normalizeClerkUser(res.data || res)).then((user) => {
    if (user?.id && clerkListCache) {
      clerkListCache = clerkListCache.map((row) => (row.id === user.id ? { ...row, ...user } : row))
    } else if (user?.id) {
      rememberClerkUsers([...(clerkListCache || []), user])
    }
    return user
  })
}
