import { initializeApp, getApps, cert, applicationDefault, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getMessaging, type Messaging } from 'firebase-admin/messaging';
import path from 'path';
import fs from 'fs';

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

export function getAdminFirestore(): Firestore {
    return getFirestore(getAdminApp());
}

export function getAdminMessaging(): Messaging {
    return getMessaging(getAdminApp());
}
