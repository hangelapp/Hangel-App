import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

// Check admin authorization
async function checkAuth(req: NextRequest) {
  const authHeader = req.headers.get('x-admin-key');
  const adminKey = process.env.ADMIN_IMPORT_KEY;

  if (!adminKey || authHeader !== adminKey) {
    return false;
  }
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const isAuthorized = await checkAuth(req);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { dataType, records } = body;

    if (!dataType || !Array.isArray(records)) {
      return NextResponse.json(
        { error: 'Missing dataType or records' },
        { status: 400 }
      );
    }

    // Initialize Firebase if not already done
    if (!getApps().length) {
      initializeApp({
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      });
    }

    const db = getFirestore();
    const collectionRef = collection(db, 'ngos');

    let importedCount = 0;

    for (const record of records) {
      try {
        await addDoc(collectionRef, {
          ...record,
          dataType,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        importedCount++;
      } catch (err) {
        console.error(`Failed to import record:`, err, record);
        // Continue with next record
      }
    }

    return NextResponse.json({
      success: true,
      dataType,
      importedCount,
      totalRecords: records.length,
    });
  } catch (error) {
    console.error('Import API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
