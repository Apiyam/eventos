import cors from 'cors'
import express from 'express'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import { createMemory } from './memory.js'
import { hashPassword, nfcId, overlaps, publicUser, talkWindow, verifyPassword } from './util.js'

const PORT = Number(process.env.PORT || 8000)
const SECRET = process.env.JWT_SECRET || 'nexus-dev-jwt'
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } })
const db = createMemory()

function sign(user) {
  return jwt.sign({ sub: user.id, role_id: user.role_id, email: user.email }, SECRET, { expiresIn: '12h' })
}

function auth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) return res.status(401).json({ message: 'No autenticado' })
  try {
    req.auth = jwt.verify(token, SECRET)
    req.user = db.users.find((item) => item.id === req.auth.sub)
    if (!req.user || req.user.active === false) return res.status(401).json({ message: 'Sesión inválida' })
    next()
  } catch {
    res.status(401).json({ message: 'Token inválido' })
  }
}

function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) return next()
  try {
    req.auth = jwt.verify(token, SECRET)
    req.user = db.users.find((item) => item.id === req.auth.sub)
  } catch {
    req.auth = null
  }
  next()
}

const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))

const api = express.Router()

api.post('/auth/login', (req, res) => {
  const email = String(req.body.email || '').toLowerCase()
  const user = db.users.find((item) => item.email === email)
  if (!user || !verifyPassword(req.body.password || '', user.password_hash)) {
    return res.status(401).json({ message: 'Credenciales inválidas' })
  }
  const token = sign(user)
  res.json({ token, access_token: token, user: publicUser(user) })
})

api.post('/auth/logout', auth, (_req, res) => {
  res.json({ ok: true })
})

api.get('/auth/profile', auth, (req, res) => {
  res.json({ user: publicUser(req.user) })
})

api.put('/auth/profile', auth, (req, res) => {
  Object.assign(req.user, {
    phone: req.body.phone ?? req.user.phone,
    full_name: req.body.full_name ?? req.user.full_name,
  })
  res.json({ user: publicUser(req.user) })
})

api.post('/auth/register-admin', optionalAuth, (req, res) => {
  const admins = db.users.filter((item) => item.role_id === 1)
  const allowed = admins.length === 0 || req.user?.role_id === 1
  if (!allowed) return res.status(403).json({ message: 'No autorizado' })
  const email = String(req.body.email || '').toLowerCase()
  if (db.users.some((item) => item.email === email)) {
    return res.status(422).json({ message: 'El correo ya existe' })
  }
  if (req.body.password !== req.body.password_confirmation) {
    return res.status(422).json({ message: 'Las contraseñas no coinciden' })
  }
  const user = {
    id: db.seq.users++,
    full_name: req.body.full_name,
    email,
    phone: req.body.phone || '',
    role_id: Number(req.body.role_id || 1),
    role: Number(req.body.role_id || 1) === 1 ? 'admin' : 'user',
    active: true,
    must_change_password: Boolean(req.body.must_change_password),
    password_hash: hashPassword(req.body.password),
    created_at: new Date().toISOString(),
  }
  db.users.push(user)
  const token = sign(user)
  res.status(201).json({ token, access_token: token, user: publicUser(user) })
})

api.post('/auth/forgot-password', (req, res) => {
  const email = String(req.body.email || '').toLowerCase()
  const token = randomToken()
  db.resetTokens.set(email, token)
  res.json({ ok: true, token })
})

api.post('/auth/reset-password', (req, res) => {
  const email = String(req.body.email || '').toLowerCase()
  if (db.resetTokens.get(email) !== req.body.token) {
    return res.status(422).json({ message: 'Token inválido' })
  }
  if (req.body.password !== req.body.password_confirmation) {
    return res.status(422).json({ message: 'Las contraseñas no coinciden' })
  }
  const user = db.users.find((item) => item.email === email)
  if (!user) return res.status(404).json({ message: 'Usuario no encontrado' })
  user.password_hash = hashPassword(req.body.password)
  db.resetTokens.delete(email)
  res.json({ ok: true })
})

api.post('/auth/verify-email', (req, res) => {
  const email = String(req.body.email || '').toLowerCase()
  const expected = db.verifyCodes.get(email)
  if (expected && expected !== String(req.body.code)) {
    return res.status(422).json({ message: 'Código inválido' })
  }
  res.json({ ok: true })
})

api.get('/users', auth, (_req, res) => {
  res.json({ data: db.users.map(publicUser) })
})

api.get('/users/:id', auth, (req, res) => {
  const user = db.users.find((item) => item.id === Number(req.params.id))
  if (!user) return res.status(404).json({ message: 'No encontrado' })
  res.json({ data: publicUser(user) })
})

api.post('/users', auth, (req, res) => {
  const email = String(req.body.email || '').toLowerCase()
  if (db.users.some((item) => item.email === email)) {
    return res.status(422).json({ message: 'El correo ya existe' })
  }
  if (req.body.password !== req.body.password_confirmation) {
    return res.status(422).json({ message: 'Las contraseñas no coinciden' })
  }
  const role_id = Number(req.body.role_id || 2)
  const user = {
    id: db.seq.users++,
    full_name: req.body.full_name,
    email,
    phone: req.body.phone || '',
    role_id,
    role: role_id === 1 ? 'admin' : 'user',
    active: true,
    password_hash: hashPassword(req.body.password || 'abcd1234'),
    created_at: new Date().toISOString(),
  }
  db.users.push(user)
  res.status(201).json({ data: publicUser(user) })
})

api.put('/users/:id', auth, (req, res) => {
  const user = db.users.find((item) => item.id === Number(req.params.id))
  if (!user) return res.status(404).json({ message: 'No encontrado' })
  Object.assign(user, {
    first_name: req.body.first_name ?? user.first_name,
    last_name: req.body.last_name ?? user.last_name,
    full_name: [req.body.first_name, req.body.last_name].filter(Boolean).join(' ') || user.full_name,
    email: req.body.email ?? user.email,
    phone: req.body.phone ?? user.phone,
    role: req.body.role ?? user.role,
  })
  res.json({ data: publicUser(user) })
})

api.put('/users/:id/toggle-access', auth, (req, res) => {
  const user = db.users.find((item) => item.id === Number(req.params.id))
  if (!user) return res.status(404).json({ message: 'No encontrado' })
  user.active = !user.active
  res.json({ data: publicUser(user) })
})

api.delete('/users/:id', auth, (req, res) => {
  const index = db.users.findIndex((item) => item.id === Number(req.params.id))
  if (index < 0) return res.status(404).json({ message: 'No encontrado' })
  db.users.splice(index, 1)
  res.json({ ok: true })
})

api.post('/students', (req, res) => {
  const clerk_user_id = String(req.body.clerk_user_id || '')
  if (!clerk_user_id) return res.status(422).json({ message: 'clerk_user_id requerido' })
  let student = db.students.find((item) => item.clerk_user_id === clerk_user_id)
  if (!student) {
    student = {
      id: db.seq.students++,
      clerk_user_id,
      full_name: req.body.full_name || '',
      email: req.body.email || '',
      nfc_id: req.body.nfc_id || nfcId(),
      talk_ids: [],
      points: 0,
      created_at: new Date().toISOString(),
    }
    db.students.push(student)
  } else {
    student.full_name = req.body.full_name || student.full_name
    student.email = req.body.email || student.email
    if (req.body.nfc_id && !student.nfc_id) student.nfc_id = req.body.nfc_id
  }
  res.status(201).json({ data: student })
})

api.get('/students', auth, (_req, res) => {
  res.json({ data: db.students })
})

api.post('/student-talks', (req, res) => {
  const student_id = Number(req.body.student_id)
  const talk_id = Number(req.body.talk_id)
  const student = db.students.find((item) => item.id === student_id)
  const talk = db.talks.find((item) => item.id === talk_id)
  if (!student || !talk) return res.status(404).json({ message: 'No encontrado' })
  const already = db.studentTalks.find((row) => row.student_id === student_id && row.talk_id === talk_id)
  if (already) return res.status(422).json({ message: 'La plática ya está registrada' })
  const row = { id: db.seq.studentTalks++, student_id, talk_id, created_at: new Date().toISOString() }
  db.studentTalks.push(row)
  student.talk_ids = [...new Set([...(student.talk_ids || []), talk_id])]
  student.points = Number(student.points || 0) + Number(talk.benefit || 0)
  if (!talk.enrolled.includes(student_id)) talk.enrolled.push(student_id)
  res.status(201).json({ data: row })
})

api.get('/student-talks/:student_id', (req, res) => {
  const student_id = Number(req.params.student_id)
  const rows = db.studentTalks.filter((row) => row.student_id === student_id)
  res.json({ data: rows })
})

api.get('/students/:clerk_user_id', (req, res) => {
  const student = db.students.find((item) => item.clerk_user_id === req.params.clerk_user_id)
  if (!student) return res.status(404).json({ message: 'No encontrado' })
  res.json({ data: student })
})

api.put('/students/:clerk_user_id/agenda', (req, res) => {
  const student = db.students.find((item) => item.clerk_user_id === req.params.clerk_user_id)
  if (!student) return res.status(404).json({ message: 'No encontrado' })
  const talkIds = (req.body.talk_ids || []).map(Number)
  const talks = talkIds.map((id) => db.talks.find((talk) => talk.id === id)).filter(Boolean)
  if (talks.length !== talkIds.length) return res.status(422).json({ message: 'Charla inválida' })

  for (let i = 0; i < talks.length; i += 1) {
    const a = talkWindow(talks[i])
    for (let j = i + 1; j < talks.length; j += 1) {
      const b = talkWindow(talks[j])
      if (overlaps(a.start, a.end, b.start, b.end)) {
        return res.status(422).json({ message: 'Horario ocupado' })
      }
    }
  }

  const prev = new Set(student.talk_ids || [])
  const next = new Set(talkIds)

  for (const talk of db.talks) {
    if (prev.has(talk.id) && !next.has(talk.id)) {
      student.points -= Number(talk.benefit || 0)
      talk.enrolled = talk.enrolled.filter((id) => id !== student.id)
    }
  }
  for (const talk of talks) {
    if (talk.enrolled.length >= talk.max_forum && !talk.enrolled.includes(student.id)) {
      return res.status(422).json({ message: 'Foro lleno' })
    }
    if (!prev.has(talk.id)) {
      student.points += Number(talk.benefit || 0)
      talk.enrolled.push(student.id)
    }
  }
  student.talk_ids = talkIds
  if (student.points < 0) student.points = 0
  res.json({ data: student })
})

api.get('/store', (_req, res) => {
  res.json({ data: db.store })
})

api.get('/store/:id', (req, res) => {
  if (req.params.id === '1') return res.json({ data: db.store })
  const item = db.store.find((row) => row.id === Number(req.params.id))
  if (!item) return res.status(404).json({ message: 'No encontrado' })
  res.json({ data: item })
})

api.post('/store', auth, (req, res) => {
  const item = {
    id: db.seq.store++,
    product: req.body.product,
    cost: Number(req.body.cost),
    quantity: Number(req.body.quantity),
  }
  db.store.push(item)
  res.status(201).json({ data: item })
})

api.patch('/store/:id/details', auth, (req, res) => {
  const item = db.store.find((row) => row.id === Number(req.params.id))
  if (!item) return res.status(404).json({ message: 'No encontrado' })
  Object.assign(item, {
    product: req.body.product ?? item.product,
    cost: req.body.cost ?? item.cost,
    quantity: req.body.quantity ?? item.quantity,
  })
  res.json({ data: item })
})

api.patch('/store/:id', (req, res) => {
  const product = db.store.find((row) => row.id === Number(req.body.id_product || req.params.id))
  if (!product) return res.status(404).json({ message: 'Producto no encontrado' })
  const qty = Number(req.body.quantity_bought || 1)
  if (product.quantity < qty) return res.status(422).json({ message: 'Sin stock' })
  const student =
    db.students.find((item) => item.id === Number(req.body.id_user)) ||
    db.students.find((item) => item.clerk_user_id === String(req.body.id_user || ''))
  const current = Number(student?.points ?? req.body.current_points_user ?? 0)
  const total = product.cost * qty
  if (current < total) return res.status(422).json({ message: 'Saldo insuficiente' })
  product.quantity -= qty
  const remaining = current - total
  if (student) student.points = remaining
  res.json({ data: product, remaining_points: remaining, student })
})

api.post('/images', auth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(422).json({ message: 'Imagen requerida' })
  const id = db.seq.images++
  const image = {
    id,
    mime: req.file.mimetype,
    buffer: req.file.buffer,
    path: `/api/images/${id}`,
  }
  db.images.push(image)
  res.status(201).json({ data: { id: image.id, path: image.path } })
})

api.get('/images/:id', (req, res) => {
  const image = db.images.find((item) => item.id === Number(req.params.id))
  if (!image) return res.status(404).json({ message: 'No encontrado' })
  res.setHeader('Content-Type', image.mime)
  res.send(image.buffer)
})

api.get('/talks', (_req, res) => {
  res.json({ data: db.talks.map(publicTalk) })
})

api.get('/talks/:id', (req, res) => {
  const talk = db.talks.find((item) => item.id === Number(req.params.id))
  if (!talk) return res.status(404).json({ message: 'No encontrado' })
  res.json({ data: publicTalk(talk) })
})

api.post('/talks', auth, (req, res) => {
  const talk = {
    id: db.seq.talks++,
    name: req.body.name,
    image_path: req.body.image_path || '',
    duration: Number(req.body.duration),
    start_time: req.body.start_time,
    benefit: Number(req.body.benefit || 0),
    max_forum: Number(req.body.max_forum || 100),
    url_nfc: req.body.url_nfc || '',
    speaker: req.body.speaker || '',
    enrolled: [],
  }
  db.talks.push(talk)
  res.status(201).json({ data: publicTalk(talk) })
})

api.put('/talks/:id', auth, (req, res) => {
  const talk = db.talks.find((item) => item.id === Number(req.params.id))
  if (!talk) return res.status(404).json({ message: 'No encontrado' })
  Object.assign(talk, {
    name: req.body.name ?? talk.name,
    image_path: req.body.image_path ?? talk.image_path,
    duration: req.body.duration ?? talk.duration,
    start_time: req.body.start_time ?? talk.start_time,
    benefit: req.body.benefit ?? talk.benefit,
    max_forum: req.body.max_forum ?? talk.max_forum,
    url_nfc: req.body.url_nfc ?? talk.url_nfc,
    speaker: req.body.speaker ?? talk.speaker,
  })
  res.json({ data: publicTalk(talk) })
})

api.delete('/talks/:id', auth, (req, res) => {
  const index = db.talks.findIndex((item) => item.id === Number(req.params.id))
  if (index < 0) return res.status(404).json({ message: 'No encontrado' })
  db.talks.splice(index, 1)
  res.json({ ok: true })
})

function publicTalk(talk) {
  const { enrolled, ...rest } = talk
  return { ...rest, enrolled_count: enrolled.length }
}

function randomToken() {
  return [...Array(16)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')
}

app.use('/api', api)
app.get('/health', (_req, res) => res.json({ ok: true }))

app.listen(PORT, () => {
  console.log(`NEXUS API http://localhost:${PORT}/api`)
})
