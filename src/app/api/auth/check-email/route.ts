import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';

function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const rawEmail = (body?.email as string | undefined) || '';
        const email = rawEmail.trim().toLowerCase();

        if (!email || !isValidEmail(email)) {
            return NextResponse.json({ error: 'Geçersiz e-posta adresi' }, { status: 400 });
        }

        // Eski telefon-pseudo-email (+90...@hangel.app) ile login'e izin vermiyoruz.
        if (email.endsWith('@hangel.app')) {
            return NextResponse.json({ exists: false, unsupported: true });
        }

        const auth = getAdminAuth();

        try {
            const user = await auth.getUserByEmail(email);
            return NextResponse.json({
                exists: true,
                name: user.displayName || '',
            });
        } catch (error: unknown) {
            if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'auth/user-not-found') {
                return NextResponse.json({ exists: false });
            }
            throw error;
        }
    } catch (error: unknown) {
        console.error('check-email error:', error);
        const message = error instanceof Error ? error.message : 'Kontrol başarısız';
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
