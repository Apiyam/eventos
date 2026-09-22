import { parseTalkDate } from './time'
import { fetchClerkUser, fetchClerkUsers, findClerkUser, makeNfcId, normalizeClerkUser, patchClerkPublic, uniqueNfcId } from './clerk'

const studentSync = new Map()
const ADMIN_TOKEN_KEY = 'eventos.admin.token'

const remote = String(import.meta.env.VITE_API_URL || 'https://vexom.com.mx/back_tec_nfc/public/api/v1/').replace(/\/$/, '')
const useSameOriginProxy = import.meta.env.DEV || import.meta.env.VITE_API_PROXY !== '0'
const API = useSameOriginProxy ? '/api' : remote

export function getAdminToken() {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

export function setAdminToken(token) {
  try {
    if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token)
    else localStorage.removeItem(ADMIN_TOKEN_KEY)
  } catch {
    /* private mode / quota */
  }
}

function readXsrfToken() {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : ''
}

function firstMessage(errors) {
  if (!errors || typeof errors !== 'object') return ''
  const value = Object.values(errors)[0]
  if (Array.isArray(value)) return value[0] || ''
  if (typeof value === 'string') return value
  return ''
}

async function parse(res) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data.status === false) {
    throw new Error(firstMessage(data.errors) || data.message || `Error ${res.status}`)
  }
  return data
}

export function unwrapList(res) {
  if (Array.isArray(res)) return res
  if (Array.isArray(res?.data?.data)) return res.data.data
  if (Array.isArray(res?.data)) return res.data
  if (Array.isArray(res?.talks)) return res.talks
  if (Array.isArray(res?.users)) return res.users
  if (Array.isArray(res?.students)) return res.students
  if (Array.isArray(res?.store)) return res.store
  if (res?.data && typeof res.data === 'object') return [res.data]
  return []
}

export function unwrapRecord(res) {
  if (!res || typeof res !== 'object') return res
  if (res.data && !Array.isArray(res.data)) return res.data
  if (res.student) return res.student
  if (res.user) return res.user
  return res
}

export function unwrapToken(res) {
  return res?.token || res?.access_token || res?.data?.token || res?.data?.access_token || ''
}

export function unwrapUser(res) {
  return res?.user || res?.data?.user || unwrapRecord(res)
}

export function unwrapImagePath(res) {
  const rec = unwrapRecord(res)
  if (typeof rec === 'string') return rec
  return (
    rec?.path ||
    rec?.url ||
    rec?.image_path ||
    rec?.image ||
    rec?.filename ||
    rec?.file ||
    ''
  )
}

export function imageUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path) || path.startsWith('blob:') || path.startsWith('data:')) return path
  if (path.startsWith('/api')) return import.meta.env.DEV ? path : `${remote}${path.replace(/^\/api/, '')}`
  const origin = remote.replace(/\/api\/v1$/i, '')
  if (path.startsWith('/')) return `${origin}${path}`
  return `${origin}/storage/${path}`
}

function studentCacheKey(clerkUserId) {
  return `eventos.student.${clerkUserId}`
}

const STUDENTS_DIR_KEY = 'eventos.students.dir'
let directory = []
let directoryJob = null

export function readStudentCache(clerkUserId) {
  try {
    const raw = localStorage.getItem(studentCacheKey(clerkUserId))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function writeStudentCache(clerkUserId, student) {
  if (!clerkUserId || !student) return
  localStorage.setItem(studentCacheKey(clerkUserId), JSON.stringify(student))
}

function readStudentsDirectory() {
  try {
    const raw = localStorage.getItem(STUDENTS_DIR_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeStudentsDirectory(list) {
  localStorage.setItem(STUDENTS_DIR_KEY, JSON.stringify(list))
}

function upsertLocalStudent(student) {
  if (!student) return student
  if (student.clerk_user_id) writeStudentCache(student.clerk_user_id, student)
  const id = String(student.student_id || student.id || '')
  const next = readStudentsDirectory().filter((row) => {
    if (student.clerk_user_id && row.clerk_user_id === student.clerk_user_id) return false
    if (id && String(row.student_id || row.id || '') === id) return false
    return true
  })
  next.push(student)
  directory = next
  writeStudentsDirectory(next)
  return student
}

export function extractStudentId(record) {
  const asId = (value) => {
    if (value == null || value === '') return 0
    if (typeof value === 'string' && !/^\d+$/.test(value.trim())) return 0
    const n = Number(value)
    return Number.isFinite(n) && n > 0 ? n : 0
  }
  return asId(record?.student_id) || asId(record?.id)
}

export function extractTalkIds(res) {
  const lists = [
    unwrapList(res),
    Array.isArray(res?.talks) ? res.talks : [],
    Array.isArray(res?.data?.talks) ? res.data.talks : [],
    Array.isArray(res?.student_talks) ? res.student_talks : [],
    Array.isArray(res?.data?.student_talks) ? res.data.student_talks : [],
  ]
  return [
    ...new Set(
      lists.flatMap((rows) =>
        rows.flatMap((row) => {
          const ids = [row?.talk_id, row?.talk?.id]
          if (row?.name || row?.speaker || row?.start_time || row?.title) ids.push(row.id)
          return ids
        }),
      ),
    ),
  ]
    .filter((id) => id != null && id !== '')
    .map(String)
}

export function localStudent(user, extra = {}) {
  const clerkUserId = user?.id || extra.clerk_user_id
  const cached = clerkUserId ? readStudentCache(clerkUserId) : null
  const talk_ids = extra.talk_ids || cached?.talk_ids || []
  const staff = Boolean(extra.staff ?? cached?.staff)
  const studentId = extractStudentId({ ...cached, ...extra })
  const points = staff
    ? 0
    : extra.points != null
      ? Number(extra.points)
      : Number(cached?.points ?? 0)
  return {
    ...cached,
    ...extra,
    id: studentId,
    student_id: studentId,
    clerk_user_id: clerkUserId,
    full_name: extra.full_name || cached?.full_name || user?.fullName || '',
    email: extra.email || cached?.email || user?.primaryEmailAddress?.emailAddress || '',
    nfc_id: extra.nfc_id || cached?.nfc_id || '',
    talk_ids,
    points,
    staff,
  }
}

function isIdTaken(error) {
  return /taken|ya (est[aá]|fue) (tomad|registrad)|already/i.test(error?.message || '')
}

async function persistStudentIdentity(clerkUserId, extra = {}, clerks = []) {
  const nfc_id = uniqueNfcId(extra.nfc_id, clerkUserId, [...clerks, ...readStudentsDirectory()])
  const student_id = extractStudentId(extra)
  const clerk = findClerkUser(clerkUserId, clerks) || {}
  const next = mixStudentRecord(
    {
      ...extra,
      clerk_user_id: clerkUserId,
      nfc_id,
      student_id,
      id: student_id,
      points: extra.staff ? extra.points : extra.points ?? clerk.points ?? 0,
    },
    clerk,
  )
  upsertLocalStudent(next)
  const sameMeta =
    clerk.nfc_id === next.nfc_id &&
    String(clerk.student_id || '') === String(next.student_id || '') &&
    Boolean(clerk.staff) === Boolean(next.staff) &&
    Number(clerk.points || 0) === Number(next.points || 0)
  if (!sameMeta) {
    await patchClerkPublic(clerkUserId, {
      nfc_id,
      student_id: student_id || next.student_id || 0,
      staff: Boolean(next.staff),
      points: next.points || 0,
      talk_ids: next.talk_ids || [],
    })
  }
  return next
}

export function registerStudent(clerkUserId, hint = {}) {
  if (!clerkUserId) return Promise.reject(new Error('clerk_user_id requerido'))
  if (studentSync.has(clerkUserId)) return studentSync.get(clerkUserId)
  const job = (async () => {
    const known = { ...readStudentCache(clerkUserId), ...hint }
    const posted = unwrapRecord(
      await api('/students', {
        method: 'POST',
        body: {
          clerk_user_id: clerkUserId,
          nfc_id: known.nfc_id || makeNfcId(),
          full_name: known.full_name || '',
          email: known.email || '',
        },
      }).catch((error) => {
        if (!isIdTaken(error)) throw error
        return known
      }),
    )
    const clerks = await fetchClerkUsers({ force: true }).catch(() => [])
    const clerk = findClerkUser(clerkUserId, clerks) || (await fetchClerkUser(clerkUserId).catch(() => null)) || {}
    return persistStudentIdentity(clerkUserId, { ...known, ...clerk, ...posted }, clerks)
  })().finally(() => studentSync.delete(clerkUserId))
  studentSync.set(clerkUserId, job)
  return job
}

function studentPoints(row) {
  if (!row) return 0
  const n = Number(row.points ?? row.current_points ?? row.current_points_user ?? row.score)
  return Number.isFinite(n) ? n : 0
}

export function asStudentProfile(row) {
  if (!row) return null
  const student_id = extractStudentId(row)
  return {
    ...row,
    id: student_id,
    student_id,
    clerk_user_id: row.clerk_user_id || (typeof row.id === 'string' ? row.id : ''),
    nfc_id: row.nfc_id || '',
    full_name: row.full_name || 'Asistente',
    email: row.email || '',
    image_url: row.image_url || '',
    points: studentPoints(row),
    talk_ids: Array.isArray(row.talk_ids) ? row.talk_ids.map(String) : [],
    staff: Boolean(row.staff),
    created_at: row.created_at || '',
  }
}

export function mixStudentRecord(student, clerk) {
  if (!student && !clerk) return null
  const identity = normalizeClerkUser(clerk) || {}
  const clerkId = student?.clerk_user_id || identity.id || clerk?.id || clerk?.clerk_user_id || ''
  return asStudentProfile({
    ...(student || {}),
    clerk_user_id: clerkId,
    first_name: identity.first_name || '',
    last_name: identity.last_name || '',
    full_name: identity.full_name || '',
    email: identity.email || '',
    nfc_id: identity.nfc_id || '',
    image_url: identity.image_url || student?.image_url || '',
    points: Math.max(studentPoints(student), studentPoints(identity)),
    staff: Boolean(identity.staff ?? student?.staff),
    talk_ids: identity.talk_ids?.length ? identity.talk_ids : student?.talk_ids || [],
    student_id: extractStudentId(student) || extractStudentId(identity) || extractStudentId(clerk),
    created_at: student?.created_at || identity.created_at || '',
  })
}

export function mixStudentsWithClerk(students, clerks) {
  const profiles = clerks.map((user) => normalizeClerkUser(user)).filter(Boolean)
  const byClerkId = new Map()
  const byStudentId = new Map()
  const byNfc = new Map()
  const byEmail = new Map()
  for (const user of profiles) {
    if (user.id) byClerkId.set(user.id, user)
    const sid = extractStudentId(user)
    if (sid) byStudentId.set(String(sid), user)
    const nfc = String(user.nfc_id || '').replace(/-/g, '').toUpperCase()
    if (nfc) byNfc.set(nfc, user)
    const email = String(user.email || '').trim().toLowerCase()
    if (email) byEmail.set(email, user)
  }
  const used = new Set()
  const mixed = students.map((row) => {
    const nfc = String(row.nfc_id || '').replace(/-/g, '').toUpperCase()
    const email = String(row.email || '').trim().toLowerCase()
    const clerk =
      byClerkId.get(row.clerk_user_id) ||
      byStudentId.get(String(extractStudentId(row) || '')) ||
      (nfc ? byNfc.get(nfc) : null) ||
      (email ? byEmail.get(email) : null) ||
      null
    if (clerk?.id) used.add(clerk.id)
    return mixStudentRecord(row, clerk)
  })
  for (const clerk of profiles) {
    if (!clerk?.id || used.has(clerk.id)) continue
    mixed.push(mixStudentRecord(null, clerk))
  }
  return mixed
}

export function getStudentDirectory() {
  return directory.length ? directory : readStudentsDirectory()
}

export async function fetchStudents(token, { force = false } = {}) {
  if (!force && directory.length) return directory
  if (!force && directoryJob) return directoryJob
  directoryJob = (async () => {
    const rows = unwrapList(await api('/students', { token }))
    const clerks = await fetchClerkUsers({ force: true })
    directory = mixStudentsWithClerk(rows, clerks)
    writeStudentsDirectory(directory)
    return directory
  })().finally(() => {
    directoryJob = null
  })
  return directoryJob
}

export function api(path, { token, method = 'GET', body, form } = {}) {
  const headers = { Accept: 'application/json' }
  const authToken = token || getAdminToken()
  if (authToken) headers.Authorization = `Bearer ${authToken}`
  const xsrf = readXsrfToken()
  if (xsrf) headers['X-XSRF-TOKEN'] = xsrf
  if (!form) headers['Content-Type'] = 'application/json'
  return fetch(`${API}${path}`, {
    method,
    credentials: 'include',
    headers,
    body: form ? body : body ? JSON.stringify(body) : undefined,
  }).then(parse)
}

export async function fetchStoreCatalog() {
  const from = async (path) => unwrapList(await api(path)).filter((row) => row?.id != null)
  let catalog = []
  try {
    catalog = await from('/store')
  } catch {
    catalog = []
  }
  if (catalog.length > 1) return catalog
  try {
    const first = await from('/store/1')
    if (first.length > 1) return first
    const seen = new Set(catalog.map((item) => item.id))
    for (const row of first) {
      if (!seen.has(row.id)) {
        seen.add(row.id)
        catalog.push(row)
      }
    }
    let misses = 0
    for (let id = 1; id <= 30; id += 1) {
      if (seen.has(id)) continue
      try {
        const rows = await from(`/store/${id}`)
        if (!rows.length) {
          misses += 1
          if (misses >= 3) break
          continue
        }
        misses = 0
        for (const row of rows) {
          if (!seen.has(row.id)) {
            seen.add(row.id)
            catalog.push(row)
          }
        }
      } catch {
        misses += 1
        if (misses >= 3) break
      }
    }
  } catch {
    return catalog
  }
  return catalog
}

export function mapTalk(talk) {
  const start = parseTalkDate(talk.start_time || talk.start)
  const end = new Date(start.getTime() + Number(talk.duration || 0) * 60000)
  return {
    id: String(talk.id),
    rawId: talk.id,
    title: talk.name || talk.title || '',
    speaker: talk.speaker || '',
    start: start.toISOString(),
    end: end.toISOString(),
    image: talk.image_path || talk.image || '',
    benefit: talk.benefit,
    maxForum: talk.max_forum,
    nfcUrl: talk.url_nfc,
    enrolled: talk.enrolled_count || 0,
  }
}
