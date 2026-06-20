import admin from 'firebase-admin'
if (!admin.apps.length) admin.initializeApp({credential: admin.credential.applicationDefault(), projectId: 'hangel-new-v18-87297865-9bcc3'})
const db = admin.firestore()
const snap = await db.collection('volunteerScoring').count().get()
console.log('COUNT=' + snap.data().count)
// Also try to read a few docs
const docs = await db.collection('volunteerScoring').limit(5).get()
console.log('DOCS_FETCHED=' + docs.size)
docs.forEach(d => console.log('DOC_ID=' + d.id))
process.exit(0)
