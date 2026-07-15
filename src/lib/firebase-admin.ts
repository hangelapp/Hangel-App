import { initializeApp, getApps, cert, applicationDefault, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getMessaging, type Messaging } from 'firebase-admin/messaging';
import { getStorage, type Storage } from 'firebase-admin/storage';
import path from 'path';
import fs from 'fs';

// Firebase Storage bucket — client config (src/firebase/config.ts) ile aynı.
const STORAGE_BUCKET = 'hangelorg.firebasestorage.app';

let adminApp: App | null = null;

function getAdminApp(): App {
    if (adminApp) return adminApp;
    if (getApps().length > 0) {
        adminApp = getApps()[0];
        return adminApp;
    }

    // Local dev: read the gitignored JSON if present.
    // Production (App Hosting / Cloud Run): fall back to Application Default
    // Credentials (provided by the runtime service account). This makes the
    // module safe to import even when no key file is bundled.
    const serviceAccountPath = path.join(process.cwd(), '.firebase-service-account.json');
    if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        adminApp = initializeApp({
            credential: cert(serviceAccount),
            projectId: serviceAccount.project_id,
        });
    } else {
        adminApp = initializeApp({ credential: applicationDefault() });
    }

    return adminApp;
}

export function getAdminAuth(): Auth {
    return getAuth(getAdminApp());
}

let firestoreInstance: Firestore | null = null;
export function getAdminFirestore(): Firestore {
    if (firestoreInstance) return firestoreInstance;
    const db = getFirestore(getAdminApp());
    // ignoreUndefinedProperties: undefined alanlar Firestore'a yazılırken hata
    // ('Cannot use undefined as a Firestore value') atıp 500 vermesin — sessizce
    // atlansın. settings() yalnız ilk kullanımdan önce çağrılabilir; instance'ı
    // cache'leyip tekrar settings çağrısından kaçınıyoruz.
    try {
        db.settings({ ignoreUndefinedProperties: true });
    } catch {
        // settings zaten uygulanmış (başka yol init etmiş) — yok say.
    }
    firestoreInstance = db;
    return db;
}

export function getAdminMessaging(): Messaging {
    return getMessaging(getAdminApp());
}

export function getAdminStorage(): Storage {
    return getStorage(getAdminApp());
}

/** Varsayılan Storage bucket'ı (admin app config'inde set edilmemiş olabilir,
 *  bu yüzden ismi açıkça veriyoruz). */
export function getAdminBucket() {
    return getAdminStorage().bucket(STORAGE_BUCKET);
}
