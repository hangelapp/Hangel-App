import admin from 'firebase-admin'
if(!admin.apps.length) admin.initializeApp({credential:admin.credential.applicationDefault(),projectId:'hangel-new-v18-87297865-9bcc3'})
const db = admin.firestore()
const snap = await db.collection('contracts').orderBy('slug').get()
const docs = snap.docs.slice(0, 15).map(d => ({ id:d.id, ...d.data() }))
import fs from 'fs'
fs.writeFileSync('/tmp/contracts-slice-0.json', JSON.stringify(docs, null, 2))
console.log('slice size:', docs.length)
process.exit(0)
