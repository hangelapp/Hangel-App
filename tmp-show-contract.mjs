import fs from 'fs'
const docs = JSON.parse(fs.readFileSync('/tmp/contracts-slice-1.json', 'utf-8'))
const slug = process.argv[2]
const doc = docs.find(d => d.slug === slug)
if (!doc) { console.log('not found'); process.exit(1) }
console.log('TITLE:', doc.title)
console.log('JURISDICTIONS:', doc.jurisdictions)
console.log('CONTENT:')
console.log(doc.content)
