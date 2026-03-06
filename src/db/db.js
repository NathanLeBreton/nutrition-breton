import Dexie from 'dexie'

export const db = new Dexie('NutritionBreton')

db.version(1).stores({
  journal:    '++id, date',
  repas:      '++id, nom',
  objectifs:  '++id',
})

// ─── OBJECTIFS ───────────────────────────────────────────────────────────────

export async function getObjectifs() {
  const obj = await db.objectifs.toCollection().first()
  return obj || { calories: 3000, proteines: 200, glucides: 250, lipides: 90 }
}

export async function saveObjectifs(data) {
  const existing = await db.objectifs.toCollection().first()
  if (existing) await db.objectifs.update(existing.id, data)
  else await db.objectifs.add(data)
}

// ─── JOURNAL ─────────────────────────────────────────────────────────────────

export async function getJournalDu(date) {
  const entry = await db.journal.where('date').equals(date).first()
  return entry ? { ...entry, items: JSON.parse(entry.items || '[]') } : { date, items: [] }
}

export async function saveJournalDu(date, items) {
  const existing = await db.journal.where('date').equals(date).first()
  const data = { date, items: JSON.stringify(items) }
  if (existing) await db.journal.update(existing.id, data)
  else await db.journal.add(data)
}

export async function getAllJournal() {
  const all = await db.journal.orderBy('date').reverse().toArray()
  return all.map(e => ({ ...e, items: JSON.parse(e.items || '[]') }))
}

// ─── REPAS ENREGISTRÉS ────────────────────────────────────────────────────────

export async function getAllRepas() {
  return await db.repas.orderBy('nom').toArray()
}

export async function saveRepas(nom, items) {
  await db.repas.add({ nom, items: JSON.stringify(items), createdAt: new Date().toISOString() })
}

export async function deleteRepas(id) {
  await db.repas.delete(id)
}
