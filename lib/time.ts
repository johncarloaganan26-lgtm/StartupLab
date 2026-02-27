export function formatTime12h(time24: string) {
  // Accepts "HH:mm" or "HH:mm:ss" and returns "h:mm AM/PM".
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(String(time24).trim())
  if (!match) return time24

  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return time24
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return time24

  const suffix = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 === 0 ? 12 : hours % 12
  return `${hour12}:${String(minutes).padStart(2, '0')} ${suffix}`
}

export function formatPHDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  const parts = new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'long',
    day: '2-digit',
  }).formatToParts(date)

  const partMap = new Map(parts.map((p) => [p.type, p.value]))
  const month = partMap.get('month')
  const day = partMap.get('day')
  const year = partMap.get('year')
  if (!month || !day || !year) return String(value)

  // Requested format example: "March/12/2026"
  return `${month}/${day}/${year}`
}

export function formatPHDateTime(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  const datePart = formatPHDate(date)
  const timePart = new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)

  return `${datePart} ${timePart}`
}
