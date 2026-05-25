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
 *   - PDF #3: reads `projectCallCriteria/{slug}` (slug derived from the
 *     selected `institution`) and forwards the org's "talep ve esasları" to
 *     the flow as `callCriteria`. Missing doc → field omitted (graceful).
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

/**
 * Turkish-aware slugify, MUST stay in sync with the super-admin
 * ai-management page (`slugifyInstitution`) so that an institution label
 * resolves to the same `projectCallCriteria` doc id on both write and read.
 */
function slugifyInstitution(label: string): string {
    return label
        .toLowerCase()
        .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i')
        .replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Build a plain-text criteria block from a projectCallCriteria document.
 * Only includes fields that are present so the prompt stays clean.
 * Returns undefined when the document has no usable content.
 */
function buildCriteriaText(data: Record<string, unknown>): string | undefined {
    const lines: string[] = [];
    const add = (label: string, value: unknown) => {
        if (typeof value === 'string' && value.trim().length > 0) {
            lines.push(`${label}: ${value.trim()}`);
        }
    };
    add('Talep ve Esaslar', data.requirements);
    add('Format', data.format);
    add('Son Başvuru Tarihi', data.deadline);
    add('Odak Alanları', data.focusAreas);
    add('Anahtar Kelimeler', data.keywords);
    return lines.length > 0 ? lines.join('\n') : undefined;
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
        let callCriteria: string | undefined;
        let runtimeConfig: { systemPrompt?: string; model?: string; temperature?: number; maxTokens?: number } | undefined;
        try {
            const db = getAdminFirestore();
            const snap = await db.collection(COLLECTIONS.aiAssistantConfig).doc('project').get();
            if (snap.exists) {
                const data = snap.data() ?? {};
                if (Array.isArray(data.knowledgeSourceSlugs)) {
                    allowedSlugs = data.knowledgeSourceSlugs.filter((x: unknown): x is string => typeof x === 'string');
                }
                runtimeConfig = {
                    systemPrompt: typeof data.systemPrompt === 'string' ? data.systemPrompt : undefined,
                    model: typeof data.model === 'string' ? data.model : undefined,
                    temperature: typeof data.temperature === 'number' ? data.temperature : undefined,
                    maxTokens: typeof data.maxTokens === 'number' ? data.maxTokens : undefined,
                };
            }

            const slug = slugifyInstitution(institution);
            if (slug) {
                const criteriaSnap = await db.collection(COLLECTIONS.projectCallCriteria).doc(slug).get();
                if (criteriaSnap.exists) {
                    callCriteria = buildCriteriaText(criteriaSnap.data() ?? {});
                }
            }
        } catch (configErr) {
            console.warn('library/project: config/criteria read failed', configErr);
        }

        const libraryContext = buildLibraryContext(allowedSlugs);
        const result = await writeProjectProposal(
            { institution, sections, libraryContext, callCriteria },
            idToken ?? undefined,
            runtimeConfig,
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
