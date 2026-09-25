const REAL_API = 'https://vexom.com.mx/back_tec_nfc/public/api/v1'

function rewriteCookie(cookie) {
  return `${String(cookie)
    .replace(/;\s*Domain=[^;]*/gi, '')
    .replace(/;\s*Path=[^;]*/gi, '')}; Path=/`
}

export default async function handler(req, res) {
  const segments = [].concat(req.query.path || [])
  const path = segments.join('/')
  if (!path || path.startsWith('eventos/')) {
    res.status(404).json({ message: 'Not found' })
    return
  }

  const incoming = new URL(req.url, `https://${req.headers.host}`)
  const target = `${REAL_API}/${path}${incoming.search}`
  const headers = {}
  for (const [key, value] of Object.entries(req.headers)) {
    if (['host', 'connection', 'content-length'].includes(key.toLowerCase())) continue
    if (value) headers[key] = value
  }

  const method = req.method || 'GET'
  const hasBody = !['GET', 'HEAD'].includes(method)
  let body
  if (hasBody && req.body != null) {
    body = typeof req.body === 'string' || Buffer.isBuffer(req.body) ? req.body : JSON.stringify(req.body)
  }

  const upstream = await fetch(target, { method, headers, body })
  const text = await upstream.text()
  const cookies =
    (typeof upstream.headers.getSetCookie === 'function' && upstream.headers.getSetCookie()) ||
    []
  if (cookies.length) {
    res.setHeader('Set-Cookie', cookies.map(rewriteCookie))
  }

  res.status(upstream.status)
  const contentType = upstream.headers.get('content-type')
  if (contentType) res.setHeader('Content-Type', contentType)
  res.setHeader('Cache-Control', 'no-store')
  res.send(text)
}
