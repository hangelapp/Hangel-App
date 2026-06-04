/**
 * Build-time markdown loader for contracts under `docs/contracts/{docId}.md`.
 *
 * Reads files synchronously from disk; only safe inside server contexts
 * (RSC, route handlers, generateStaticParams, generateMetadata). Calling
 * any export from this module in a `'use client'` file will fail the build.
 *
 * Front matter format (optional — defaults applied when missing):
 *
 *   ---
 *   version: 1.0
 *   effectiveDate: 2026-06-01
 *   lastUpdated: 2026-06-03
 *   title: hangel — EU Privacy Policy
 *   ---
 *
 * We do not pull in a YAML parser to keep the dependency surface flat; only
 * `key: value` pairs (one per line) inside the leading `---` block are read.
 *
 * Markdown → HTML conversion: this project does not currently bundle
 * `react-markdown` / `next-mdx`. Per CLAUDE.md we MUST NOT add dependencies
 * silently, so the loader returns the raw markdown body and a minimal
 * "safe HTML" rendering produced by `renderMarkdownToSafeHtml` below. Pages
 * pass that string through the existing `sanitizeHtml` helper before
 * `dangerouslySetInnerHTML`.
 */

import 'server-only';
import fs from 'node:fs';
import path from 'node:path';

import type { Jurisdiction } from './jurisdiction';
import { resolveDocId, type ContractType } from './registry';
import { renderMarkdownToSafeHtml as renderMarkdownToSafeHtmlShared } from './markdown';

// Re-export for callers that still import from the loader. Keeps the prior
// public surface intact while the actual implementation now lives in the
// client-safe `./markdown` module so the settings detail page can use it too.
export const renderMarkdownToSafeHtml = renderMarkdownToSafeHtmlShared;

const DOCS_ROOT = path.join(process.cwd(), 'docs', 'contracts');

export interface ContractDocMeta {
  docId: string;
  jurisdiction: Jurisdiction;
  type: ContractType;
  title: string;
  version: string;
  effectiveDate: string | null;
  lastUpdated: string | null;
}

export interface ContractDoc extends ContractDocMeta {
  /** Raw markdown body, with front matter stripped. */
  markdown: string;
  /** Best-effort safe HTML (paragraphs + headings + lists) — for pages that
   *  cannot import a markdown renderer. Still passes through sanitizeHtml. */
  html: string;
}

interface FrontMatter {
  title?: string;
  version?: string;
  effectiveDate?: string;
  lastUpdated?: string;
}

function parseFrontMatter(raw: string): { fm: FrontMatter; body: string } {
  if (!raw.startsWith('---')) return { fm: {}, body: raw };
  const end = raw.indexOf('\n---', 3);
  if (end === -1) return { fm: {}, body: raw };
  const block = raw.slice(3, end).trim();
  const body = raw.slice(end + 4).replace(/^\s*\n/, '');
  const fm: Record<string, string> = {};
  for (const line of block.split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    if (key) fm[key] = value;
  }
  return { fm: fm as FrontMatter, body };
}

/**
 * Load a contract doc by id. Returns `null` if the file is missing — callers
 * should treat that as "not yet authored" and either fall back or 404.
 */
export function loadContractDoc(docId: string, jurisdiction: Jurisdiction, type: ContractType): ContractDoc | null {
  // Defence-in-depth: docId comes from registry but normalise anyway.
  const safeId = docId.replace(/[^a-z0-9-]/gi, '');
  if (!safeId) return null;

  const filePath = path.join(DOCS_ROOT, `${safeId}.md`);
  let raw: string;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }

  const { fm, body } = parseFrontMatter(raw);
  const meta: ContractDocMeta = {
    docId: safeId,
    jurisdiction,
    type,
    title: fm.title || deriveTitleFromMarkdown(body) || safeId,
    version: fm.version || '0.1',
    effectiveDate: fm.effectiveDate || null,
    lastUpdated: fm.lastUpdated || null,
  };
  return {
    ...meta,
    markdown: body,
    html: renderMarkdownToSafeHtml(body),
  };
}

/**
 * High-level helper used by pages: resolve docId via registry, then load.
 */
export function loadContractForJurisdiction(jurisdiction: Jurisdiction, type: ContractType): ContractDoc | null {
  const docId = resolveDocId(jurisdiction, type);
  if (!docId) return null;
  return loadContractDoc(docId, jurisdiction, type);
}

/**
 * List every markdown file under `docs/contracts/` (used by admin UI to show
 * which docs exist on disk vs. which are still missing). Returns docIds only.
 */
export function listAvailableContractDocs(): string[] {
  try {
    return fs.readdirSync(DOCS_ROOT)
      .filter(f => f.endsWith('.md'))
      .map(f => f.slice(0, -3));
  } catch {
    return [];
  }
}

function deriveTitleFromMarkdown(body: string): string | null {
  const firstH1 = /^#\s+(.+?)\s*$/m.exec(body);
  return firstH1 ? firstH1[1].trim() : null;
}
