// Firestore güvenlik kurallarını Admin SDK + service account ile deploy eder.
// CLI/reauth gerekmez. Çalıştır: cd ~/new-app && node deploy-rules.mjs
import admin from 'firebase-admin';
import { readFileSync } from 'node:fs';
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(readFileSync('.firebase-service-account.json','utf8'))) });

const source = readFileSync('firestore.rules', 'utf8');
const ruleset = await admin.securityRules().releaseFirestoreRulesetFromSource(source);
console.log('✅ Firestore rules CANLI. Ruleset:', ruleset?.name ?? '(ok)');
process.exit(0);
