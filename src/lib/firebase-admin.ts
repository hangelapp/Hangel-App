import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import path from 'path';
import fs from 'fs';

let adminApp: App | null = null;

function getAdminApp(): App {
    if (adminApp) return adminApp;
    if (getApps().length > 0) {
        adminApp = getApps()[0];
        return adminApp;
    }

    const serviceAccountPath = path.join(process.cwd(), '.firebase-service-account.json');
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

    adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id,
    });

    return adminApp;
}

export function getAdminAuth(): Auth {
    return getAuth(getAdminApp());
}

export function getAdminFirestore(): Firestore {
    return getFirestore(getAdminApp());
}
