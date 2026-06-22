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
 *
 * Tasarım — hangel Liquid Glass: gradient banner, glass article container,
 * jurisdiction switcher pill grubu. Settings (`/settings/contracts/[slug]`)
 * detay sayfasıyla aynı dil — paylaşılan `ContractBanner` + `ContractActions`
 * + `ContractTOC` client component'leri kullanılır.
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
import { ContractBanner } from '@/app/settings/contracts/[slug]/_components/contract-banner';
import { ContractActions } from '@/app/settings/contracts/[slug]/_components/contract-actions';
import { PublicContractBody } from './_public-body';

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
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-10 space-y-6 contract-page">
      <div className="flex items-center justify-between gap-2 print:hidden">
        <Link
          href="/settings/contracts"
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
        >
          ← Tüm sözleşmeler
        </Link>
        <ContractActions title={active.title} shareText={`hangel — ${active.title}`} />
      </div>

      <ContractBanner
        title={active.title}
        eyebrow={`hangel · ${label}`}
        jurisdiction={JURISDICTION_LABEL[active.jurisdiction]}
        version={active.version}
        effectiveDate={active.effectiveDate}
        lastUpdated={active.lastUpdated}
        status="published"
      />

      {usingFallback && (
        <p className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900 dark:bg-amber-900/20 dark:border-amber-700/40 dark:text-amber-200 print:hidden">
          {JURISDICTION_LABEL[jurisdiction]} için yerelleştirilmiş sürüm henüz yayınlanmadı —
          {' '}{JURISDICTION_LABEL[DEFAULT_JURISDICTION]} sürümü gösteriliyor.
        </p>
      )}

      <JurisdictionSwitcher type={requested} active={active.jurisdiction} lang={sp.lang} />

      <PublicContractBody html={html} />

      <footer className="border-t pt-4 text-xs text-muted-foreground flex flex-wrap items-center gap-3 print:hidden">
        <span>
          docId: <code className="font-mono">{active.docId}</code>
        </span>
        <span>· hangel — yayında, yasal bağlayıcı sürüm</span>
      </footer>
    </main>
  );
}

function JurisdictionSwitcher({ type, active, lang }: { type: ContractType; active: Jurisdiction; lang?: string }) {
  return (
    <div className="flex flex-wrap gap-1.5 print:hidden">
      {JURISDICTIONS.map(j => {
        const href = `/contracts/${type}?j=${encodeURIComponent(j)}${lang ? `&lang=${encodeURIComponent(lang)}` : ''}`;
        const isActive = j === active;
        return (
          <Link
            key={j}
            href={href}
            prefetch={false}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              isActive
                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                : 'border-border bg-background hover:bg-accent text-muted-foreground hover:text-foreground'
            }`}
          >
            {JURISDICTION_LABEL[j]}
          </Link>
        );
      })}
    </div>
  );
}
