// Reading a contacts file (Excel .xlsx or .csv) in the browser for the WhatsApp
// address book: find which column is what, pull the rows out, and say what is
// wrong with the ones that cannot be used. The server checks every row again.

export type ContactRow = { name: string; phone: string; altPhone: string; city: string; type: string; tags: string; notes: string }
export type ParsedContacts = {
  rows: ContactRow[]
  /** which column of the file was used for what (shown to the admin before importing) */
  columns: { field: keyof ContactRow; header: string }[]
  total: number; valid: number; invalid: number; repeated: number
  invalidRows: { row: number; phone: string; reason: string }[]
  hadHeader: boolean
}

const FIELDS: { field: keyof ContactRow; match: RegExp }[] = [
  { field: 'altPhone', match: /alt|other|second|landline|दूसरा/i },
  { field: 'phone', match: /whats|mobile|phone|contact ?no|number|cell|मोबाइल|फ़ोन|फोन|नंबर/i },
  { field: 'name', match: /name|customer|owner|garage|shop|नाम/i },
  { field: 'city', match: /city|town|district|location|शहर/i },
  { field: 'tags', match: /tag|label|segment|group/i },
  { field: 'type', match: /type|category|role/i },
  { field: 'notes', match: /note|remark|comment|detail/i },
]

/** "98765 43210", "+91-98765-43210", "09876543210" → "919876543210"; '' when it is not an Indian mobile. */
export function normalizePhone(raw: unknown): string {
  let d = String(raw ?? '').replace(/\D/g, '')
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1)
  if (d.length === 10) d = `91${d}`
  return /^91[6-9]\d{9}$/.test(d) ? d : ''
}
const whyNot = (raw: unknown) => {
  const d = String(raw ?? '').replace(/\D/g, '')
  if (!d) return 'no number'
  if (d.length < 10) return 'too short'
  if (d.length > 12) return 'too long'
  return 'not an Indian mobile number'
}
/** A cell as text. Excel keeps a mobile number as a number — it must not turn into 9.87654321E9. */
const cell = (v: unknown): string => {
  if (v == null) return ''
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(v)
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  return String(v).replace(/\s+/g, ' ').trim()
}

/** RFC-4180-ish CSV: quoted cells, doubled quotes, commas / semicolons / tabs. */
export function parseCsv(text: string): string[][] {
  const t = text.replace(/^﻿/, '')
  const first = t.split(/\r?\n/, 1)[0] || ''
  const sep = [',', ';', '\t'].sort((a, b) => first.split(b).length - first.split(a).length)[0]
  const out: string[][] = []
  let row: string[] = []; let cur = ''; let quoted = false
  for (let i = 0; i < t.length; i++) {
    const ch = t[i]
    if (quoted) {
      if (ch === '"') { if (t[i + 1] === '"') { cur += '"'; i++ } else quoted = false } else cur += ch
    } else if (ch === '"') quoted = true
    else if (ch === sep) { row.push(cur); cur = '' }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && t[i + 1] === '\n') i++
      row.push(cur); cur = ''
      if (row.some((c) => c.trim())) out.push(row)
      row = []
    } else cur += ch
  }
  row.push(cur)
  if (row.some((c) => c.trim())) out.push(row)
  return out
}

/** Rows of cells → contacts, working out the columns from the header row (or, without one, from what the cells look like). */
export function rowsToContacts(table: unknown[][]): ParsedContacts {
  const data = table.map((r) => (r || []).map(cell)).filter((r) => r.some(Boolean))
  if (!data.length) return { rows: [], columns: [], total: 0, valid: 0, invalid: 0, repeated: 0, invalidRows: [], hadHeader: false }
  const head = data[0]
  const hadHeader = !head.some((c) => normalizePhone(c)) && head.some((c) => FIELDS.some((f) => f.match.test(c)))
  const map: Partial<Record<keyof ContactRow, number>> = {}
  if (hadHeader) {
    head.forEach((h, i) => {
      const f = FIELDS.find((x) => x.match.test(h) && map[x.field] === undefined)
      if (f) map[f.field] = i
    })
  }
  const body = hadHeader ? data.slice(1) : data
  // no usable header: the column that is mostly mobile numbers is the number, the first wordy one the name
  if (map.phone === undefined) {
    const width = Math.max(...body.map((r) => r.length))
    let best = -1; let bestHits = 0
    for (let c = 0; c < width; c++) { const hits = body.slice(0, 50).filter((r) => normalizePhone(r[c])).length; if (hits > bestHits) { best = c; bestHits = hits } }
    if (best >= 0) map.phone = best
    if (map.name === undefined) {
      for (let c = 0; c < width; c++) if (c !== best && body.slice(0, 20).filter((r) => /[a-zऀ-ॿ]{2,}/i.test(r[c] || '')).length >= Math.min(3, body.length)) { map.name = c; break }
    }
  }
  const at = (r: string[], f: keyof ContactRow) => (map[f] === undefined ? '' : r[map[f] as number] || '')
  const seen = new Set<string>()
  const rows: ContactRow[] = []; const invalidRows: ParsedContacts['invalidRows'] = []
  let invalid = 0; let repeated = 0
  body.forEach((r, i) => {
    const raw = at(r, 'phone')
    const phone = normalizePhone(raw)
    if (!phone) { invalid++; if (invalidRows.length < 50) invalidRows.push({ row: i + (hadHeader ? 2 : 1), phone: raw, reason: whyNot(raw) }) }
    else if (seen.has(phone)) repeated++
    else seen.add(phone)
    // every row goes to the server (it reports the same numbers); the counts above are for the preview
    rows.push({ name: at(r, 'name'), phone: raw, altPhone: at(r, 'altPhone'), city: at(r, 'city'), type: at(r, 'type'), tags: at(r, 'tags'), notes: at(r, 'notes') })
  })
  const columns = (Object.keys(map) as (keyof ContactRow)[]).map((field) => ({ field, header: hadHeader ? head[map[field] as number] : `Column ${(map[field] as number) + 1}` }))
  return { rows, columns, total: body.length, valid: seen.size, invalid, repeated, invalidRows, hadHeader }
}

/** Read an .xlsx or .csv file picked by the admin. Throws an Error with a message fit to show. */
export async function readContactsFile(file: File): Promise<ParsedContacts> {
  const name = file.name.toLowerCase()
  if (file.size > 15 * 1024 * 1024) throw new Error('This file is larger than 15 MB. Split it and import in parts.')
  let table: unknown[][]
  if (/\.(csv|txt|tsv)$/.test(name) || /csv|text\/plain/.test(file.type)) {
    table = parseCsv(await file.text())
  } else if (/\.xlsx$/.test(name)) {
    const { readSheet } = await import('read-excel-file/universal')
    try { table = (await readSheet(file)) as unknown[][] } catch { throw new Error('This Excel file could not be read. Save it again as .xlsx (or as CSV) and try once more.') }
  } else if (/\.xls$/.test(name)) {
    throw new Error('Old .xls files cannot be read. Open it in Excel and “Save as” .xlsx or CSV.')
  } else {
    throw new Error('Choose an Excel (.xlsx) or CSV file.')
  }
  const parsed = rowsToContacts(table)
  if (!parsed.total) throw new Error('This file has no rows.')
  if (!parsed.columns.some((c) => c.field === 'phone')) throw new Error('No column with mobile numbers was found. Name the column “Phone” or “WhatsApp Number”.')
  if (parsed.total > 20000) throw new Error('A file can have at most 20,000 rows. Split it and import in parts.')
  return parsed
}

const q = (v: unknown) => { const s = String(v ?? ''); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }
export const toCsv = (rows: (string | number)[][]) => `﻿${rows.map((r) => r.map(q).join(',')).join('\r\n')}\r\n`
export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const url = URL.createObjectURL(new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a'); a.href = url; a.download = filename
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
export const SAMPLE_ROWS: string[][] = [
  ['Name', 'WhatsApp Number', 'Alternate Phone', 'City', 'Type', 'Tags', 'Notes'],
  ['Ramesh Yadav', '9876543210', '', 'Delhi', 'Customer', 'Customer, VIP', 'Bought a GPS tracker'],
  ['Suresh Kumar', '9123456789', '', 'Jaipur', 'Mechanic', 'Mechanic', ''],
  ['AutoTech Garage', '9988766554', '9988700000', 'Mumbai', 'Garage', 'Garage, GPS Lead', 'Wants a demo'],
]
