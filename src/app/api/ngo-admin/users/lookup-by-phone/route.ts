/**
 * POST /api/ngo-admin/users/lookup-by-phone
 *
 * Etkinlik editöründe konuşmacı/sanatçı eklerken: girilen TELEFON bir hangel
 * üyesine ait mi? Üyeyse uid + adını döner ki editör ismi otomatik doldurup
 * userId'yi contributor'a bağlasın.
 *
 * Auth: ngo-admin / super-admin token (list/route.ts ile aynı yetkilendirme).
 *
 * Body: { phone: string }
 * Yanıt: { found: boolean, uid?: string, name?: string }
 * Hata:  { errorCode, message }
 *
 * PII: yalnızca ad + uid döner; başka kullanıcı alanı sızdırılmaz.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { canonicalPhone, phoneMatchCandidates, toE164 } from '@/lib/phone-normalize';
import { resolveOrgAdminCtx } from '@/lib/ngo-admin/org-admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** users doc'undan görünen adı çöz (link-or-create / passes route'larıyla aynı sıra). */
function resolveName(d: Record<string, unknown> | undefined): string {
    if (!d) return '';
    const personal = (d.personalInfo as { fullName?: string; firstName?: string; lastName?: string } | undefined) || {};
    const fullName = typeof d.fullName === 'string' ? d.fullName : '';
    const name = typeof d.name === 'string' ? d.name : '';
    const displayName = typeof d.displayName === 'string' ? d.displayName : '';
    const firstName = typeof d.firstName === 'string' ? d.firstName : (personal.firstName || '');
    const lastName = typeof d.lastName === 'string' ? d.lastName : (personal.lastName || '');
    return (
        (personal.fullName || '').trim() ||
        fullName.trim() ||
        name.trim() ||
        displayName.trim() ||
        `${firstName} ${lastName}`.trim()
    );
}

export async function POST(req: NextRequest) {
    // Yetki: STK / marka / kulüp yöneticisi VEYA super-admin. Eski dar authorize()
    // yalnız managedNgoId + role==='ngo-admin' kabul ediyordu → kulüp/marka
    // yöneticileri (managedClubId/managedBrandId) "Yetki gerekli" hatası alıyordu.
    // Paylaşılan resolveOrgAdminCtx üç managed alanını da destekler.
    const auth = await resolveOrgAdminCtx(req);
    if (!auth.ok) {
        return NextResponse.json({ errorCode: 'FORBIDDEN', message: auth.error }, { status: auth.status });
    }

    let body: { phone?: unknown };
    try {
        body = (await req.json()) as { phone?: unknown };
    } catch {
        return NextResponse.json({ errorCode: 'BAD_BODY', message: 'Geçersiz istek.' }, { status: 400 });
    }

    const rawPhone = typeof body?.phone === 'string' ? body.phone : '';
    const canonical = canonicalPhone(rawPhone, '+90');
    if (!canonical || canonical.length < 7) {
        return NextResponse.json({ errorCode: 'INVALID_PHONE', message: 'Geçerli bir telefon girin.' }, { status: 400 });
    }

    try {
        const auth = getAdminAuth();
        const db = getAdminFirestore();

        // 1) Önce Firebase Auth — getUserByPhoneNumber (E.164).
        const e164 = toE164(rawPhone, '+90');
        if (e164) {
            try {
                const user = await auth.getUserByPhoneNumber(e164);
                // ÖNCE users doc'undan tam adı (ad + SOYAD) çöz; Auth displayName
                // çoğu kez yalnız ad olduğu için soyad kaybolmasın. Doc boşsa Auth'a düş.
                let name = '';
                try {
                    const udoc = await db.collection(COLLECTIONS.users).doc(user.uid).get();
                    name = resolveName(udoc.data() as Record<string, unknown> | undefined);
                } catch { /* doc yoksa Auth displayName'e düş */ }
                if (!name) name = user.displayName || '';
                return NextResponse.json({ found: true, uid: user.uid, name });
            } catch {
                // auth/user-not-found — Firestore'a düş.
            }
        }

        // 2) Firestore users — phone alanını olası tüm yazımlarla ara.
        // Şema farkı: bazı kayıtlarda top-level `phone`, bazılarında `personalInfo.phone`.
        const candidates = phoneMatchCandidates(rawPhone, '+90');
        if (candidates.length > 0) {
            const [byPhone, byPersonal] = await Promise.all([
                db.collection(COLLECTIONS.users).where('phone', 'in', candidates).limit(1).get().catch(() => null),
                db.collection(COLLECTIONS.users).where('personalInfo.phone', 'in', candidates).limit(1).get().catch(() => null),
            ]);
            const doc = (byPhone && !byPhone.empty ? byPhone.docs[0] : null) || (byPersonal && !byPersonal.empty ? byPersonal.docs[0] : null);
            if (doc) {
                const name = resolveName(doc.data() as Record<string, unknown> | undefined);
                return NextResponse.json({ found: true, uid: doc.id, name });
            }
        }

        return NextResponse.json({ found: false });
    } catch (e) {
        console.error('[lookup-by-phone] internal error', e);
        return NextResponse.json({ errorCode: 'INTERNAL_ERROR', message: 'Beklenmeyen hata.' }, { status: 500 });
    }
}
