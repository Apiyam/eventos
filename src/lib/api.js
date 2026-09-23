import { parseTalkDate } from './time'

const ADMIN_TOKEN_KEY = 'eventos.admin.token'

const REAL_API = 'https://vexom.com.mx/back_tec_nfc/public/api/v1'

function resolveRemote() {
  const configured = String(import.meta.env.VITE_API_URL || REAL_API).replace(/\/$/, '')
  if (/localhost|127\.0\.0\.1/i.test(configured)) return REAL_API
  return configured
}

const remote = resolveRemote()
const API = remote

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

const STUDENT_SESSION_KEY = 'eventos.student.enrollment'
const STUDENTS_DIR_KEY = 'eventos.students.dir'
let directory = []
let directoryJob = null

export function getStudentEnrollment() {
  try {
    return localStorage.getItem(STUDENT_SESSION_KEY) || ''
  } catch {
    return ''
  }
}

export function setStudentEnrollment(enrollment) {
  try {
    if (enrollment) localStorage.setItem(STUDENT_SESSION_KEY, enrollment)
    else localStorage.removeItem(STUDENT_SESSION_KEY)
  } catch {
    /* private mode / quota */
  }
}

function writeStudentsDirectory(list) {
  try {
    localStorage.setItem(STUDENTS_DIR_KEY, JSON.stringify(list))
  } catch {
    /* ignore */
  }
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

function studentPoints(row) {
  if (!row) return 0
  const n = Number(row.points ?? row.current_points ?? row.current_points_user ?? row.score)
  return Number.isFinite(n) ? n : 0
}

export function sameCode(a, b) {
  return String(a || '')
    .trim()
    .replace(/-/g, '')
    .toUpperCase() ===
    String(b || '')
      .trim()
      .replace(/-/g, '')
      .toUpperCase()
}

export function asStudentProfile(row) {
  if (!row) return null
  const student_id = extractStudentId(row)
  const enrollment_number = String(row.enrollment_number || row.matricula || row.enrollment || '').trim()
  const card_number = String(row.card_number || row.nfc_id || row.nfc || '').trim()
  return {
    ...row,
    id: student_id,
    student_id,
    enrollment_number,
    card_number,
    nfc_id: card_number,
    full_name: row.full_name || enrollment_number || 'Asistente',
    email: row.email || '',
    image_url: row.image_url || '',
    points: studentPoints(row),
    talk_ids: Array.isArray(row.talk_ids)
      ? row.talk_ids.map(String)
      : Array.isArray(row.talks)
        ? row.talks.map((talk) => String(talk.id || talk.talk_id)).filter(Boolean)
        : [],
    talks: Array.isArray(row.talks) ? row.talks : undefined,
    staff: Boolean(row.staff),
    created_at: row.created_at || '',
  }
}

export function findStudentByEnrollment(students, enrollment) {
  return students.find((row) => sameCode(row.enrollment_number, enrollment)) || null
}

export async function fetchStudents(token, { force = false } = {}) {
  if (!force && directory.length) return directory
  if (!force && directoryJob) return directoryJob
  directoryJob = (async () => {
    const rows = unwrapList(await api('/students', { token }))
    directory = rows.map(asStudentProfile).filter(Boolean)
    writeStudentsDirectory(directory)
    return directory
  })().finally(() => {
    directoryJob = null
  })
  return directoryJob
}

export async function fetchTalks() {
  const res = await fetch(`${remote}/talks`, { headers: { Accept: 'application/json' } })
  return unwrapList(await parse(res)).map(mapTalk)
}

export async function fetchStudentTalks(student) {
  if (Array.isArray(student?.talks) && student.talks.length) {
    return extractTalkIds({ data: student.talks })
  }
  const enrollment = student?.enrollment_number
  const studentId = extractStudentId(student)
  try {
    const rows = unwrapList(await api('/student-talks')).filter((row) => {
      if (enrollment && sameCode(row.enrollment_number || row.student?.enrollment_number, enrollment)) return true
      if (studentId && Number(row.student_id || row.student?.id) === studentId) return true
      return false
    })
    if (rows.length) return extractTalkIds({ data: rows })
  } catch {
    /* try by id */
  }
  if (studentId) {
    try {
      return extractTalkIds(await api(`/student-talks/${studentId}`))
    } catch {
      /* keep listed talks */
    }
  }
  return (student?.talk_ids || []).map(String)
}

export async function loginStudentByEnrollment(enrollment) {
  const needle = String(enrollment || '').trim()
  if (!needle) throw new Error('Escribe tu matrícula')
  const list = await fetchStudents(undefined, { force: true })
  const found = findStudentByEnrollment(list, needle)
  if (!found) throw new Error('Matrícula no registrada')
  const talk_ids = await fetchStudentTalks(found)
  return asStudentProfile({ ...found, talk_ids })
}

export function registerTalkAttendance(student, talkId) {
  const talk_id = Number(talkId)
  const enrollment_number = student?.enrollment_number
  const student_id = extractStudentId(student)
  const body = enrollment_number ? { enrollment_number, talk_id } : { student_id, talk_id }
  return api('/student-talks', { method: 'POST', body })
}

export function createStudentRecord(payload, token) {
  return api('/students', {
    token,
    method: 'POST',
    body: {
      enrollment_number: payload.enrollment_number,
      card_number: payload.card_number,
    },
  }).then((res) => asStudentProfile(unwrapRecord(res)))
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
    speaker: talk.speaker || talk.company || '',
    start: start.toISOString(),
    end: end.toISOString(),
    image: talk.image_path || talk.image || '',
    benefit: talk.benefit,
    maxForum: talk.max_forum,
    nfcUrl: talk.url_nfc,
    enrolled: talk.enrolled_count || 0,
  }
}
