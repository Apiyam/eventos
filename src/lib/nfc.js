export function normalizeScanCode(raw) {
  const text = String(raw || '').trim()
  if (!text) return ''
  try {
    const url = new URL(text)
    const fromQuery = url.searchParams.get('nfc') || url.searchParams.get('code') || url.searchParams.get('student_id')
    if (fromQuery) return fromQuery.trim()
    const last = url.pathname.split('/').filter(Boolean).pop() || ''
    return decodeURIComponent(last)
  } catch {
    return text.replace(/^MOSTLA[:\s-]*/i, '').trim()
  }
}

export function findStudentByCode(students, code) {
  const needle = normalizeScanCode(code)
  if (!needle) return null
  const compact = needle.replace(/-/g, '').toUpperCase()
  return (
    students.find((row) => {
      const nfc = String(row.nfc_id || '').replace(/-/g, '').toUpperCase()
      const studentId = String(row.student_id || row.id || '')
      const clerkId = String(row.clerk_user_id || '')
      const email = String(row.email || '').trim().toLowerCase()
      return (
        nfc === compact ||
        studentId === needle ||
        clerkId === needle ||
        clerkId.toUpperCase() === compact ||
        (email && email === needle.toLowerCase())
      )
    }) || null
  )
}

export function qrImageUrl(value, size = 220) {
  const data = encodeURIComponent(String(value || ''))
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=8&data=${data}`
}
