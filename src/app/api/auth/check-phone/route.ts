import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';

function isValidE164(phone: string): boolean {
    return /^\+[1-9]\d{6,14}$/.test(phone);
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { phone } = body as { phone: string };

        if (!phone || !isValidE164(phone)) {
            return NextResponse.json({ error: 'Geçersiz telefon numarası' }, { status: 400 });
        }

        const pseudoEmail = `${phone}@hangel.app`;
        const auth = getAdminAuth();

        try {
            const user = await auth.getUserByEmail(pseudoEmail);
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
        console.error('check-phone error:', error);
        return NextResponse.json(
            { error: error.message || 'Kontrol başarısız' },
            { status: 500 }
        );
    }
}
