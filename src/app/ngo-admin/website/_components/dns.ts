import { REQUIRED_NS } from './constants';

export async function checkDnsRecords(domain: string): Promise<{ ok: boolean; foundNS: string[]; error?: string }> {
    try {
        const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=NS`, { cache: 'no-store' });
        if (!res.ok) return { ok: false, foundNS: [], error: `DNS sorgusu başarısız: HTTP ${res.status}` };
        const data = await res.json();
        const answers: Array<{ type?: number; data?: string }> = data?.Answer || [];
        const foundNS = answers
            .filter(a => a?.type === 2)
            .map(a => String(a.data || '').toLowerCase().replace(/\.$/, ''));
        const ok = REQUIRED_NS.every(ns => foundNS.some(found => found.endsWith(ns)));
        return { ok, foundNS };
    } catch (e) {
        const err = e as { message?: string };
        return { ok: false, foundNS: [], error: err?.message || 'DNS sorgusu başarısız' };
    }
}
