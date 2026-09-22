import { hashPassword } from './util.js'

const adminEmail = process.env.ADMIN_EMAIL || 'admin@nexus.local'
const adminPassword = process.env.ADMIN_PASSWORD || 'admin1234'

export function createMemory() {
  const db = {
    seq: { users: 1, students: 1, talks: 1, store: 1, images: 1, studentTalks: 1 },
    users: [],
    students: [],
    talks: [],
    store: [],
    images: [],
    studentTalks: [],
    resetTokens: new Map(),
    verifyCodes: new Map(),
  }

  db.users.push({
    id: db.seq.users++,
    full_name: 'Admin NEXUS',
    first_name: 'Admin',
    last_name: 'NEXUS',
    email: adminEmail,
    phone: '',
    role_id: 1,
    role: 'admin',
    active: true,
    must_change_password: false,
    password_hash: hashPassword(adminPassword),
    created_at: new Date().toISOString(),
  })

  const seed = [
    ['IA que no alucina', 50, '2026-10-13 10:00:00', 40, 420, 'Elisa Navarro'],
    ['WebAssembly en el edge', 50, '2026-10-13 10:00:00', 30, 180, 'Marco Peña'],
    ['React sin magia', 50, '2026-10-13 11:00:00', 40, 420, 'Diego Álvarez'],
    ['NFC y credenciales', 45, '2026-10-13 11:15:00', 50, 90, 'Iván Cruz'],
    ['Observabilidad', 50, '2026-10-13 12:00:00', 30, 180, 'Camila Ortiz'],
    ['Sistemas distribuidos', 50, '2026-10-13 13:00:00', 40, 420, 'Andrés Molina'],
    ['Realidad extendida', 45, '2026-10-13 13:00:00', 35, 120, 'Sofía Ríos'],
    ['Cierre MOSTLA DAY', 50, '2026-10-13 14:10:00', 20, 420, 'Elisa Navarro'],
  ]

  for (const [name, duration, start_time, benefit, max_forum, speaker] of seed) {
    db.talks.push({
      id: db.seq.talks++,
      name,
      image_path: '',
      duration,
      start_time,
      benefit,
      max_forum,
      url_nfc: '',
      speaker,
      enrolled: [],
    })
  }

  db.store.push({
    id: db.seq.store++,
    product: 'Pizza',
    cost: 80,
    quantity: 100,
  })

  return db
}
