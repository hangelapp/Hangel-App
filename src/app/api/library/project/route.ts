/**
 * PDF-71-impl: POST /api/library/project
 *
 * Wave 6A `library/page.tsx` ProjectWriterDialog calls this with
 *   { institution: string, sections: { summary, goals, audience, activities, budget } }
 * and expects { fullProposal: string }.
 *
 * Behaviour:
 *   - Validates `institution` (non-empty string) and `sections` (object). At
 *     least one section field must be a non-empty string — otherwise the
 *     model has nothing to expand.
 *   - Reads `aiAssistantConfig/project` for `knowledgeSourceSlugs` (same
 *     filter as the chat route).
 *   - Optionally accepts `Authorization: Bearer <idToken>` → forwarded to
 *     `writeProjectProposal` for per-user daily quota (P1-8c).
 *   - Errors → `{ errorCode, message }` shape.
 *
 * Schema note: `impact` is allowed by the flow but the current Wave 6A
 * dialog only submits 5 fields — we pass `impact` through if present, but
 * do not require it.
 */
import { NextResponse } from 'next/server';
import { writeProjectProposal, type ProjectWriterInput } from '@/ai/flows/project-writer-flow';
import { AIQuotaExceededError } from '@/ai/flow-auth';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { librarySections, type LibrarySection } from '@/lib/library';

export const runtime = 'nodejs';

function buildLibraryContext(allowedSlugs: string[]): string {
    const sections: LibrarySection[] = allowedSlugs.length > 0
        ? librarySections.filter(s => allowedSlugs.includes(s.slug))
        : librarySections;
    return sections
        .map(s => {
            const itemTitles = (s.items ?? []).map(i => `- ${i.title}`).join('\n');
            return `## ${s.title}\n${s.description}\n${itemTitles}`;
        })
        .join('\n\n');
}

function pickString(value: unknown): string | undefined {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
}

export async function POST(req: Request) {
    try {
        const idToken = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? null;
        const body = await req.json().catch(() => null);
        const institution = typeof body?.institution === 'string' ? body.institution.trim() : '';
        const sectionsRaw: Record<string, unknown> = (body?.sections && typeof body.sections === 'object')
            ? (body.sections as Record<string, unknown>)
            : {};

        if (!institution) {
            return NextResponse.json(
                { errorCode: 'INVALID_BODY', message: 'Geçersiz istek: hedef kurum (institution) zorunludur.' },
                { status: 400 },
            );
        }

        const sections: ProjectWriterInput['sections'] = {
            summary: pickString(sectionsRaw.summary),
            goals: pickString(sectionsRaw.goals),
            audience: pickString(sectionsRaw.audience),
            activities: pickString(sectionsRaw.activities),
            budget: pickString(sectionsRaw.budget),
            impact: pickString(sectionsRaw.impact),
        };

        // Reject empty-everywhere payloads — the flow would still respond,
        // but the result would be hallucinated since the user supplied nothing.
        const anyContent = Object.values(sections).some(v => typeof v === 'string' && v.length > 0);
        if (!anyContent) {
            return NextResponse.json(
                { errorCode: 'INVALID_BODY', message: 'En az bir proje bölümünü doldurmanız gerekir.' },
                { status: 400 },
            );
        }

        let allowedSlugs: string[] = [];
        try {
            const db = getAdminFirestore();
            const snap = await db.collection(COLLECTIONS.aiAssistantConfig).doc('project').get();
            if (snap.exists) {
                const data = snap.data() ?? {};
                if (Array.isArray(data.knowledgeSourceSlugs)) {
                    allowedSlugs = data.knowledgeSourceSlugs.filter((x: unknown): x is string => typeof x === 'string');
                }
            }
        } catch (configErr) {
            console.warn('library/project: aiAssistantConfig read failed', configErr);
        }

        const libraryContext = buildLibraryContext(allowedSlugs);
        const result = await writeProjectProposal(
            { institution, sections, libraryContext },
            idToken ?? undefined,
        );

        return NextResponse.json({ fullProposal: result.fullProposal });
    } catch (err: unknown) {
        if (err instanceof AIQuotaExceededError) {
            return NextResponse.json(
                { errorCode: 'QUOTA_EXCEEDED', message: 'Günlük AI kullanım limitiniz doldu. Lütfen yarın tekrar deneyin.' },
                { status: 429 },
            );
        }
        console.error('library/project error', err);
        return NextResponse.json(
            { errorCode: 'INTERNAL_ERROR', message: 'AI servisi geçici olarak yanıt vermiyor.' },
            { status: 500 },
        );
    }
}
