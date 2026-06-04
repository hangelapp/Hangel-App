import admin from 'firebase-admin'
import fs from 'node:fs'

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'hangel-new-v18-87297865-9bcc3'
  })
}
const db = admin.firestore()

function clean(obj) {
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === '') continue
    out[k] = v
  }
  return out
}

async function apply(docId, enrichments, mapFn) {
  const ref = db.collection('library').doc(docId)
  const snap = await ref.get()
  const existing = snap.exists ? snap.data() : { slug: docId, title: docId, description: '', icon: 'Library', items: [] }
  const itemsBySlug = new Map((existing.items || []).map(it => [it.slug, it]))
  let updated = 0, created = 0
  for (const e of enrichments) {
    const fields = clean(mapFn(e))
    const cur = itemsBySlug.get(e.slug)
    if (cur) {
      itemsBySlug.set(e.slug, { ...cur, ...fields })
      updated++
    } else {
      itemsBySlug.set(e.slug, { slug: e.slug, title: e.slug, content: '', ...fields })
      created++
    }
  }
  await ref.set({ ...existing, items: Array.from(itemsBySlug.values()) }, { merge: true })
  return { updated, created, total: itemsBySlug.size }
}

const priorBooks = JSON.parse(fs.readFileSync('/tmp/book-enrich-completed.json', 'utf8'))     // 232
const recoveryBooks = JSON.parse(fs.readFileSync('/tmp/recovery-completed.json', 'utf8'))     // 28 books + 15 films mixed
const recoveryBookOnly = recoveryBooks.filter(e => e.coverUrl !== undefined && e.posterUrl === undefined)
const recoveryFilmsOnly = recoveryBooks.filter(e => e.posterUrl !== undefined)
const fallbackBooks = JSON.parse(fs.readFileSync('/tmp/missing-books-fallback.json', 'utf8')) // 28 manual
const fallbackFilms = JSON.parse(fs.readFileSync('/tmp/missing-films-fallback.json', 'utf8')) // 10 manual

const allBooks = [...priorBooks, ...recoveryBookOnly, ...fallbackBooks]
const allFilms = [...recoveryFilmsOnly, ...fallbackFilms]

console.log(`Books to apply: ${allBooks.length} (prior=${priorBooks.length}, recovery=${recoveryBookOnly.length}, fallback=${fallbackBooks.length})`)
console.log(`Films to apply: ${allFilms.length} (recovery=${recoveryFilmsOnly.length}, fallback=${fallbackFilms.length})`)

const br = await apply('kitaplar', allBooks, e => ({ coverUrl: e.coverUrl, synopsis: e.synopsis, pages: e.pages }))
const fr = await apply('filmler', allFilms, e => ({ posterUrl: e.posterUrl, description: e.description, durationMinutes: e.durationMinutes }))

console.log('BOOKS result:', JSON.stringify(br))
console.log('FILMS result:', JSON.stringify(fr))
process.exit(0)
