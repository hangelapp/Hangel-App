#!/usr/bin/env node

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const serviceAccountPath = path.join(__dirname, '../.firebase-service-account.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('Service account key not found at', serviceAccountPath);
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function deleteCollection(collectionPath, batchSize) {
    const collectionRef = db.collection(collectionPath);
    const query = collectionRef.limit(batchSize);
    
    let totalDeleted = 0;
    
    return new Promise((resolve, reject) => {
        async function deleteQueryBatch() {
            try {
                const snapshot = await query.get();

                if (snapshot.size === 0) {
                    resolve(totalDeleted);
                    return;
                }

                const batch = db.batch();
                snapshot.docs.forEach((doc) => {
                    batch.delete(doc.ref);
                });
                
                await batch.commit();
                totalDeleted += snapshot.size;

                console.log(`Deleted ${totalDeleted} documents so far...`);

                process.nextTick(() => {
                    deleteQueryBatch();
                });
            } catch (err) {
                reject(err);
            }
        }
        deleteQueryBatch();
    });
}

async function main() {
    try {
        console.log('Deleting all documents in "ngos" collection...');
        const total = await deleteCollection('ngos', 500);
        console.log(`Successfully deleted total ${total} NGOs.`);
        process.exit(0);
    } catch (error) {
        console.error('Error during deletion:', error);
        process.exit(1);
    }
}

main();
