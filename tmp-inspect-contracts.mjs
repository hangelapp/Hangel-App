import fs from 'fs'
const docs = JSON.parse(fs.readFileSync('/tmp/contracts-slice-1.json', 'utf-8'))
for (const doc of docs) {
  const cl = (doc.content || '').length
  console.log(`${doc.slug} | jx:${JSON.stringify(doc.jurisdictions || [])} | len:${cl} | title:${doc.title}`)
}
