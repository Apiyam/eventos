export function normalizeScanCode(raw) {
  const text = String(raw || '').trim()
  if (!text) return ''
  try {
    const url = new URL(text)
    const fromQuery = url.searchParams.get('nfc') || url.searchParams.get('code') || url.searchParams.get('card')
    if (fromQuery) return fromQuery.trim()
    const last = url.pathname.split('/').filter(Boolean).pop() || ''
    return decodeURIComponent(last)
  } catch {
    return text.replace(/^MOSTLA[:\s-]*/i, '').trim()
  }
}

function compact(value) {
  return String(value || '').replace(/-/g, '').toUpperCase()
}

export function findStudentByCode(students, code) {
  const needle = normalizeScanCode(code)
  if (!needle) return null
  const folded = compact(needle)
  return (
    students.find((row) => {
      const card = compact(row.card_number || row.nfc_id)
      const enrollment = compact(row.enrollment_number)
      const studentId = String(row.student_id || row.id || '')
      return card === folded || enrollment === folded || studentId === needle
    }) || null
  )
}

export function findTalkByCode(talks, code) {
  const needle = normalizeScanCode(code)
  if (!needle) return null
  const folded = compact(needle)
  return (
    talks.find((talk) => {
      const urlCode = compact(normalizeScanCode(talk.nfcUrl || talk.url_nfc || ''))
      return String(talk.id) === needle || urlCode === folded
    }) || null
  )
}

export function publicNfcUrl(code) {
  const clean = String(code || '').trim()
  const path = `/nfc/${encodeURIComponent(clean)}`
  if (typeof window === 'undefined') return path
  return `${window.location.origin}${path}`
}

export function qrImageUrl(value, size = 220) {
  const data = encodeURIComponent(String(value || ''))
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=8&data=${data}`
}
