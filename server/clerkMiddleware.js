const CLERK_API = 'https://api.clerk.com/v1'

export function publicClerkUser(user) {
  if (!user) return null
  const meta = user.public_metadata || {}
  const email = user.email_addresses?.[0]?.email_address || ''
  return {
    id: user.id,
    full_name: [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || email || 'Asistente',
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    email,
    image_url: user.image_url || '',
    nfc_id: meta.nfc_id || '',
    student_id: meta.student_id ?? '',
    staff: Boolean(meta.staff),
    points: Number(meta.points || 0),
    talk_ids: Array.isArray(meta.talk_ids) ? meta.talk_ids.map(String) : [],
    created_at: user.created_at || '',
    public_metadata: meta,
  }
}

async function clerkRequest(secret, path, init = {}) {
  const res = await fetch(`${CLERK_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const error = new Error(data.errors?.[0]?.message || data.message || `Clerk ${res.status}`)
    error.status = res.status
    throw error
  }
  return data
}

function send(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8')
        resolve(raw ? JSON.parse(raw) : {})
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}

async function proxyN8n(n8nUrl, payload, res) {
  const response = await fetch(n8nUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  const text = await response.text()
  if (!text) {
    send(res, 502, {
      message: 'n8n respondió vacío. Importa n8n/mostla-clerk.json, actívalo y deja la respuesta en lastNode.',
    })
    return
  }
  const data = JSON.parse(text)
  send(res, response.status || 200, data)
}

export function createClerkMiddleware(secret, n8nUrl = '') {
  return async function clerkMiddleware(req, res, next) {
    const url = new URL(req.url, 'http://localhost')
    if (!url.pathname.startsWith('/clerk')) return next()

    try {
      if (n8nUrl) {
        if (req.method === 'GET' && url.pathname === '/clerk/users') {
          await proxyN8n(n8nUrl, { op: 'list' }, res)
          return
        }
        const one = url.pathname.match(/^\/clerk\/users\/([^/]+)$/)
        const verify = url.pathname.match(/^\/clerk\/users\/([^/]+)\/verify-email$/)
        if (req.method === 'GET' && one) {
          await proxyN8n(n8nUrl, { op: 'get', id: decodeURIComponent(one[1]) }, res)
          return
        }
        if (req.method === 'POST' && verify) {
          await proxyN8n(n8nUrl, { op: 'verify', id: decodeURIComponent(verify[1]) }, res)
          return
        }
        if (req.method === 'PATCH' && one) {
          const body = await readBody(req)
          await proxyN8n(
            n8nUrl,
            {
              op: 'patch',
              id: decodeURIComponent(one[1]),
              public_metadata: body.public_metadata || body,
            },
            res,
          )
          return
        }
        send(res, 404, { message: 'No encontrado' })
        return
      }

      if (!secret) {
        send(res, 501, { message: 'Define CLERK_SECRET_KEY o VITE_N8N_CLERK_URL en .env' })
        return
      }

      if (req.method === 'GET' && url.pathname === '/clerk/users') {
        const users = await clerkRequest(secret, '/users?limit=100&order_by=-created_at')
        const list = Array.isArray(users) ? users : users.data || []
        send(res, 200, { data: list.map(publicClerkUser) })
        return
      }

      const one = url.pathname.match(/^\/clerk\/users\/([^/]+)$/)
      const verify = url.pathname.match(/^\/clerk\/users\/([^/]+)\/verify-email$/)
      if (req.method === 'GET' && one) {
        const user = await clerkRequest(secret, `/users/${encodeURIComponent(one[1])}`)
        send(res, 200, { data: publicClerkUser(user) })
        return
      }

      if (req.method === 'POST' && verify) {
        const user = await clerkRequest(secret, `/users/${encodeURIComponent(verify[1])}`)
        const emailId = user.email_addresses?.[0]?.id
        if (!emailId) throw new Error('El usuario no tiene correo')
        await clerkRequest(secret, `/email_addresses/${encodeURIComponent(emailId)}`, {
          method: 'PATCH',
          body: JSON.stringify({ verified: true }),
        })
        send(res, 200, { data: { id: user.id, verified: true } })
        return
      }

      if (req.method === 'PATCH' && one) {
        const body = await readBody(req)
        const public_metadata = body.public_metadata || body
        await clerkRequest(secret, `/users/${encodeURIComponent(one[1])}/metadata`, {
          method: 'PATCH',
          body: JSON.stringify({ public_metadata }),
        })
        const user = await clerkRequest(secret, `/users/${encodeURIComponent(one[1])}`)
        send(res, 200, { data: publicClerkUser(user) })
        return
      }

      send(res, 404, { message: 'No encontrado' })
    } catch (error) {
      send(res, error.status || 500, { message: error.message })
    }
  }
}
