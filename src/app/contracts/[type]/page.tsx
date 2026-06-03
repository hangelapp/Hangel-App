/**
 * Public contract viewer — `/contracts/{type}?j={jurisdiction}&lang={locale}`.
 *
 * Resolves the right document by:
 *   1. Type from the URL segment (must be a {@link ContractType}).
 *   2. Jurisdiction from `?j=` query if present, otherwise from the edge geo
 *      header, otherwise from `?lang=`, otherwise the {@link DEFAULT_JURISDICTION}.
 *
 * Renders the markdown via the build-time loader and the existing
 * `sanitizeHtml` helper — no new dependencies, no `dangerouslySetInnerHTML`
 * on untrusted content.
 *
 * `generateStaticParams` pre-renders one page per ContractType; jurisdiction
 * variants are served dynamically (the page reads request headers) so we
 * don't multiply the static surface area.
 */

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Link from 'next/link';

import { sanitizeHtml } from '@/lib/sanitize-html';
import {
  CONTRACT_TYPES,
  CONTRACT_TYPE_LABEL,
  isContractType,
  type ContractType,
} from '@/lib/contracts/registry';
import {
  DEFAULT_JURISDICTION,
  JURISDICTIONS,
  JURISDICTION_LABEL,
  jurisdictionFromHeaders,
  resolveJurisdiction,
  type Jurisdiction,
} from '@/lib/contracts/jurisdiction';
import { loadContractForJurisdiction } from '@/lib/contracts/loader';

interface SearchParams {
  j?: string;
  lang?: string;
}

interface PageProps {
  params: Promise<{ type: string }>;
  searchParams: Promise<SearchParams>;
}

function parseJurisdiction(value: string | undefined): Jurisdiction | null {
  if (!value) return null;
  return (JURISDICTIONS as readonly string[]).includes(value) ? (value as Jurisdiction) : null;
}

async function resolveRequestJurisdiction(searchParams: SearchParams): Promise<Jurisdiction> {
  const explicit = parseJurisdiction(searchParams.j);
  if (explicit) return explicit;
  const h = await headers();
  const geo = jurisdictionFromHeaders(h);
  return resolveJurisdiction({
    locale: searchParams.lang || h.get('accept-language')?.split(',')[0] || null,
    geoCountry: geo.geoCountry,
    geoUsState: geo.geoUsState,
  });
}

export async function generateStaticParams() {
  return CONTRACT_TYPES.map(type => ({ type }));
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { type } = await params;
  const sp = await searchParams;
  if (!isContractType(type)) return { title: 'Sözleşme bulunamadı' };
  const jurisdiction = await resolveRequestJurisdiction(sp);
  const doc = loadContractForJurisdiction(jurisdiction, type);
  const label = CONTRACT_TYPE_LABEL[type];
  return {
    title: doc?.title || `${label} — hangel`,
    description: `${label} (${JURISDICTION_LABEL[jurisdiction]})`,
  };
}

export default async function ContractPage({ params, searchParams }: PageProps) {
  const { type } = await params;
  const sp = await searchParams;
  if (!isContractType(type)) notFound();

  const requested: ContractType = type;
  const jurisdiction = await resolveRequestJurisdiction(sp);
  const doc = loadContractForJurisdiction(jurisdiction, requested);
  const fallback = !doc && jurisdiction !== DEFAULT_JURISDICTION
    ? loadContractForJurisdiction(DEFAULT_JURISDICTION, requested)
    : null;
  const active = doc || fallback;
  if (!active) notFound();

  const label = CONTRACT_TYPE_LABEL[requested];
  const html = sanitizeHtml(active.html);
  const usingFallback = !doc && !!fallback;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <header className="space-y-3 border-b pb-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
        <h1 className="text-3xl font-black tracking-tight">{active.title}</h1>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center rounded-full border px-2 py-0.5">
            {JURISDICTION_LABEL[active.jurisdiction]}
          </span>
          <span>v{active.version}</span>
          {active.effectiveDate && <span>· yürürlük {active.effectiveDate}</span>}
          {active.lastUpdated && <span>· güncellendi {active.lastUpdated}</span>}
        </div>
        {usingFallback && (
          <p className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-900 dark:bg-amber-900/20 dark:border-amber-700/40 dark:text-amber-200">
            {JURISDICTION_LABEL[jurisdiction]} için yerelleştirilmiş sürüm henüz yayınlanmadı —
            {JURISDICTION_LABEL[DEFAULT_JURISDICTION]} sürümü gösteriliyor.
          </p>
        )}
        <JurisdictionSwitcher type={requested} active={active.jurisdiction} lang={sp.lang} />
      </header>

      <article
        className="prose prose-sm sm:prose-base dark:prose-invert max-w-none"
        // sanitizeHtml is the project's vetted DOMPurify wrapper; renderMarkdownToSafeHtml
        // only emits an allow-listed tag set so the sanitizer pass is a tight loop.
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <footer className="border-t pt-4 text-xs text-muted-foreground">
        docId: <code className="font-mono">{active.docId}</code>
      </footer>
    </main>
  );
}

function JurisdictionSwitcher({ type, active, lang }: { type: ContractType; active: Jurisdiction; lang?: string }) {
  return (
    <div className="flex flex-wrap gap-1.5 pt-1">
      {JURISDICTIONS.map(j => {
        const href = `/contracts/${type}?j=${encodeURIComponent(j)}${lang ? `&lang=${encodeURIComponent(lang)}` : ''}`;
        const isActive = j === active;
        return (
          <Link
            key={j}
            href={href}
            prefetch={false}
            className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
              isActive
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-muted bg-background hover:bg-accent'
            }`}
          >
            {JURISDICTION_LABEL[j]}
          </Link>
        );
      })}
    </div>
  );
}
