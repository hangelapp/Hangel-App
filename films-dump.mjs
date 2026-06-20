import admin from 'firebase-admin'
if (!admin.apps.length) admin.initializeApp({credential: admin.credential.applicationDefault(), projectId: 'hangel-new-v18-87297865-9bcc3'})
const db = admin.firestore()
const snap = await db.collection('library').doc('filmler').get()
const items = (snap.exists ? snap.data().items : []) || []
console.log(JSON.stringify(items.map(it => ({ slug: it.slug, title: it.title, content: it.content })), null, 2))
