const REAL_API = 'https://vexom.com.mx/back_tec_nfc/public/api/v1'

function asList(value) {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.data)) return value.data
  if (Array.isArray(value?.students)) return value.students
  return []
}

export default async function handler(req, res) {
  const id = String(req.query.id || '').trim()
  if (!id) {
    res.status(400).json({ data: [] })
    return
  }

  const talkRes = await fetch(`${REAL_API}/talks/${encodeURIComponent(id)}`)
  const talkJson = await talkRes.json().catch(() => ({}))
  const talk = talkJson.data && !Array.isArray(talkJson.data) ? talkJson.data : talkJson
  let students = asList(talk?.students)

  if (!students.length) {
    const rowsRes = await fetch(`${REAL_API}/student-talks`)
    const rowsJson = await rowsRes.json().catch(() => ({}))
    students = asList(rowsJson)
      .filter((row) => String(row.talk_id || row.talk?.id || '') === id)
      .map((row) => row.student || row)
  }

  res.setHeader('Cache-Control', 'no-store')
  res.status(200).json({ data: students })
}
