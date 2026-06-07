'use client';

/**
 * Rehber / içe aktarılan kişileri hangel kullanıcılarıyla eşleştir.
 *
 * Privacy-preserving: telefon numaraları SHA-256 hash'lenip `/api/contacts/sync`'e
 * gönderilir (raw numara sunucuya gitmez). E-postalar düz metin gider (Gmail/vCard
 * davet akışı için).
 *
 * Kanonikleştirme: kayıt sırasında numara `canonicalPhone(phone, '90')` ile
 * (ülke kodu + baştaki 0 atılmış ulusal form) saklanır. Rehberdeki kayıt
 * "+90…", "0…" veya "…" olabildiğinden HER ki̇şinin numarasının iki varyantı
 * (`canonicalPhone(raw)` ve `canonicalPhone(raw, '90')`) hash'lenir — böylece
 * tüm yazımlar yakalanır.
 *
 * Batch: sunucu istek başına ≤500 hash/e-posta kabul eder; büyük rehberler
 * için 500'lük dilimlere bölünür.
 */

import { canonicalPhone } from '@/lib/phone-normalize';
import { hashPhoneForMatch } from '@/lib/native-contacts';

export interface MatchableContact {
    id: string;
    phones?: string[];
    emails?: string[];
}

export interface HangelMatch {
    userId: string;
    name?: string;
    avatarUrl?: string;
}

const BATCH = 500;

export async function matchHangelUsers(
    contacts: MatchableContact[],
    idToken: string,
): Promise<Record<string, HangelMatch>> {
    const phoneHashToIds = new Map<string, string[]>();
    const emailToIds = new Map<string, string[]>();
    const hashSet = new Set<string>();
    const emailSet = new Set<string>();

    for (const c of contacts) {
        for (const raw of c.phones ?? []) {
            const variants = new Set(
                [canonicalPhone(raw), canonicalPhone(raw, '90')].filter(Boolean),
            );
            for (const v of variants) {
                const h = await hashPhoneForMatch(v);
                if (!phoneHashToIds.has(h)) phoneHashToIds.set(h, []);
                phoneHashToIds.get(h)!.push(c.id);
                hashSet.add(h);
            }
        }
        for (const e of c.emails ?? []) {
            const em = e.trim().toLowerCase();
            if (!em) continue;
            if (!emailToIds.has(em)) emailToIds.set(em, []);
            emailToIds.get(em)!.push(c.id);
            emailSet.add(em);
        }
    }

    const hashes = Array.from(hashSet);
    const emails = Array.from(emailSet);
    if (hashes.length === 0 && emails.length === 0) return {};

    const result: Record<string, HangelMatch> = {};
    const maxLen = Math.max(hashes.length, emails.length);
    for (let i = 0; i < maxLen; i += BATCH) {
        const hSlice = hashes.slice(i, i + BATCH);
        const eSlice = emails.slice(i, i + BATCH);
        if (hSlice.length === 0 && eSlice.length === 0) continue;

        try {
            const res = await fetch('/api/contacts/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
                body: JSON.stringify({ hashes: hSlice, emails: eSlice }),
            });
            if (!res.ok) continue;
            const data = (await res.json().catch(() => null)) as {
                matches?: Array<{ hash: string } & HangelMatch>;
                emailMatches?: Array<{ email: string } & HangelMatch>;
            } | null;
            if (!data) continue;

            for (const m of data.matches ?? []) {
                for (const id of phoneHashToIds.get(m.hash) ?? []) {
                    if (!result[id]) result[id] = { userId: m.userId, name: m.name, avatarUrl: m.avatarUrl };
                }
            }
            for (const m of data.emailMatches ?? []) {
                for (const id of emailToIds.get((m.email || '').toLowerCase()) ?? []) {
                    if (!result[id]) result[id] = { userId: m.userId, name: m.name, avatarUrl: m.avatarUrl };
                }
            }
        } catch {
            continue;
        }
    }
    return result;
}
