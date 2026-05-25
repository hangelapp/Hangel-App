/**
 * PDF-71-impl: POST /api/library/chat
 *
 * Wave 6A `library/page.tsx` AssistantDialog calls this with
 *   { message: string, history?: ChatMessage[] }
 * and expects { reply: string }.
 *
 * Behaviour:
 *   - Validates `message` (non-empty string, ≤2000 chars after flow-level
 *     sanitize). `history` is accepted but currently ignored — the flow has
 *     no chat-history input; recorded here so future iterations can wire it.
 *   - Reads `aiAssistantConfig/library` for `knowledgeSourceSlugs` (filter
 *     which library sections feed the prompt). Empty/missing → use all.
 *   - Optionally accepts `Authorization: Bearer <idToken>` and forwards it
 *     to the flow for per-user daily quota (P1-8c). Absent → flow
 *     fails-open (quota skipped).
 *   - Errors → `{ errorCode, message }` shape. Raw `error.message` never
 *     leaked to client; logged server-side instead.
 *
 * NOT included (deferred to Wave 6F-tail):
 *   - Per-IP rate limit via `checkRateLimit`. See PDF-71-impl follow-up.
 */
import { NextResponse } from 'next/server';
import { askLibraryAssistant } from '@/ai/flows/library-ai-assistant';
import { AIQuotaExceededError } from '@/ai/flow-auth';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { librarySections, type LibrarySection } from '@/lib/library';

export const runtime = 'nodejs';

function buildLibraryContext(allowedSlugs: string[]): string {
    const sections: LibrarySection[] = allowedSlugs.length > 0
        ? librarySections.filter(s => allowedSlugs.includes(s.slug))
        : librarySections;
    // Keep the projection cheap — title + description per section, plus the
    // child item titles so the assistant can name resources without hallucinating.
    return sections
        .map(s => {
            const itemTitles = (s.items ?? []).map(i => `- ${i.title}`).join('\n');
            return `## ${s.title}\n${s.description}\n${itemTitles}`;
        })
        .join('\n\n');
}

export async function POST(req: Request) {
    try {
        const idToken = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? null;
        const body = await req.json().catch(() => null);
        const message = typeof body?.message === 'string' ? body.message.trim() : '';
        if (!message) {
            return NextResponse.json(
                { errorCode: 'INVALID_BODY', message: 'Geçersiz istek: mesaj boş olamaz.' },
                { status: 400 },
            );
        }

        // Read AI config: knowledgeSourceSlugs + sistem prompt + model + temp + maxTokens
        let allowedSlugs: string[] = [];
        let runtimeConfig: { systemPrompt?: string; model?: string; temperature?: number; maxTokens?: number } | undefined;
        try {
            const db = getAdminFirestore();
            const snap = await db.collection(COLLECTIONS.aiAssistantConfig).doc('library').get();
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
        } catch (configErr) {
            console.warn('library/chat: aiAssistantConfig read failed', configErr);
        }

        const libraryContext = buildLibraryContext(allowedSlugs);
        const result = await askLibraryAssistant(
            { userQuestion: message, libraryContext },
            idToken ?? undefined,
            runtimeConfig,
        );

        return NextResponse.json({ reply: result.answer });
    } catch (err: unknown) {
        if (err instanceof AIQuotaExceededError) {
            return NextResponse.json(
                { errorCode: 'QUOTA_EXCEEDED', message: 'Günlük AI kullanım limitiniz doldu. Lütfen yarın tekrar deneyin.' },
                { status: 429 },
            );
        }
        console.error('library/chat error', err);
        return NextResponse.json(
            { errorCode: 'INTERNAL_ERROR', message: 'AI servisi geçici olarak yanıt vermiyor.' },
            { status: 500 },
        );
    }
}
