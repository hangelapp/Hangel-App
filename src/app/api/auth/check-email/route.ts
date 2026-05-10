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
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                return NextResponse.json({ exists: false });
            }
            throw error;
        }
    } catch (error: any) {
        console.error('check-email error:', error);
        return NextResponse.json(
            { error: error.message || 'Kontrol başarısız' },
            { status: 500 }
        );
    }
}
