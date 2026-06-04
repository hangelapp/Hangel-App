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
 * Minimal, dependency-free markdown → HTML pass.
 *
 * Supports:
 *   - ATX headings (`#` … `######`)
 *   - Fenced code blocks (``` … ```), optional language tag
 *   - Unordered (`-` / `*`) and ordered (`1.`) lists, with one level of nesting
 *     (two-space indent)
 *   - Pipe tables (`| col | col |` + `|---|---|`)
 *   - Multi-line blockquotes (`> …`)
 *   - Horizontal rule (`---`)
 *   - Inline: bold, italic, inline code, links
 *
 * Output is always re-sanitized by `sanitizeHtml` before render — this is
 * intentionally conservative; for richer rendering install `react-markdown`
 * and swap the client renderer.
 */
export function renderMarkdownToSafeHtml(md: string): string {
  const lines = md.split('\n');
  const out: string[] = [];

  let para: string[] = [];
  let inUl = false;
  let inOl = false;
  let inNestedUl = false;
  let inBlockquote = false;
  let bqBuf: string[] = [];

  const flushPara = () => {
    if (para.length === 0) return;
    out.push(`<p>${inlineFmt(para.join(' '))}</p>`);
    para = [];
  };
  const closeNestedUl = () => {
    if (inNestedUl) { out.push('</ul>'); inNestedUl = false; }
  };
  const closeLists = () => {
    closeNestedUl();
    if (inUl) { out.push('</ul>'); inUl = false; }
    if (inOl) { out.push('</ol>'); inOl = false; }
  };
  const flushBlockquote = () => {
    if (!inBlockquote) return;
    out.push(`<blockquote>${bqBuf.map(l => inlineFmt(l)).join('<br />')}</blockquote>`);
    bqBuf = [];
    inBlockquote = false;
  };

  let i = 0;
  while (i < lines.length) {
    const rawLine = lines[i];
    const line = rawLine.replace(/\s+$/u, '');

    // --- Fenced code block: ``` (optional lang) ... ``` ---
    const fence = /^```([a-zA-Z0-9_-]*)\s*$/.exec(line);
    if (fence) {
      flushPara(); closeLists(); flushBlockquote();
      const lang = fence[1] || '';
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        buf.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      const langClass = lang ? ` class="language-${lang}"` : '';
      out.push(`<pre><code${langClass}>${escapeHtml(buf.join('\n'))}</code></pre>`);
      continue;
    }

    // --- Tables: detect header row followed by separator row ---
    if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1])) {
      flushPara(); closeLists(); flushBlockquote();
      const headerCells = splitRow(line);
      const sepCells = splitRow(lines[i + 1]);
      const aligns = sepCells.map(c => {
        const trimmed = c.trim();
        const left = trimmed.startsWith(':');
        const right = trimmed.endsWith(':');
        if (left && right) return 'center';
        if (right) return 'right';
        if (left) return 'left';
        return null;
      });
      i += 2;
      const bodyRows: string[][] = [];
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) {
        bodyRows.push(splitRow(lines[i]));
        i++;
      }
      const thead = '<thead><tr>' + headerCells
        .map((c, idx) => `<th${aligns[idx] ? ` align="${aligns[idx]}"` : ''}>${inlineFmt(c.trim())}</th>`)
        .join('') + '</tr></thead>';
      const tbody = '<tbody>' + bodyRows.map(row =>
        '<tr>' + row.map((c, idx) =>
          `<td${aligns[idx] ? ` align="${aligns[idx]}"` : ''}>${inlineFmt(c.trim())}</td>`
        ).join('') + '</tr>'
      ).join('') + '</tbody>';
      out.push(`<table>${thead}${tbody}</table>`);
      continue;
    }

    if (line.trim() === '') {
      flushPara();
      closeLists();
      flushBlockquote();
      i++;
      continue;
    }

    // --- Headings ---
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      flushPara(); closeLists(); flushBlockquote();
      const level = heading[1].length;
      out.push(`<h${level}>${inlineFmt(heading[2])}</h${level}>`);
      i++;
      continue;
    }

    // --- Lists: ordered, unordered, one level of nesting (two-space indent) ---
    const olMatch = /^(\s*)(\d+)\.\s+(.*)$/.exec(line);
    const ulMatch = /^(\s*)[-*+]\s+(.*)$/.exec(line);
    if (olMatch || ulMatch) {
      flushPara(); flushBlockquote();
      const indent = (olMatch ? olMatch[1] : ulMatch![1]).length;
      const content = olMatch ? olMatch[3] : ulMatch![2];
      const ordered = !!olMatch;
      if (indent >= 2) {
        // nested item — wrap in nested <ul>
        if (!inUl && !inOl) {
          // no parent list yet — open one as if top-level
          out.push(ordered ? '<ol>' : '<ul>');
          if (ordered) inOl = true; else inUl = true;
        }
        if (!inNestedUl) { out.push('<ul>'); inNestedUl = true; }
        out.push(`<li>${inlineFmt(content)}</li>`);
      } else {
        closeNestedUl();
        if (ordered) {
          if (inUl) { out.push('</ul>'); inUl = false; }
          if (!inOl) { out.push('<ol>'); inOl = true; }
        } else {
          if (inOl) { out.push('</ol>'); inOl = false; }
          if (!inUl) { out.push('<ul>'); inUl = true; }
        }
        out.push(`<li>${inlineFmt(content)}</li>`);
      }
      i++;
      continue;
    }

    // --- Blockquote (multi-line consecutive `> ` lines collapse into one) ---
    if (line.startsWith('> ') || line === '>') {
      flushPara(); closeLists();
      inBlockquote = true;
      bqBuf.push(line.replace(/^>\s?/, ''));
      i++;
      continue;
    }

    // --- Horizontal rule ---
    if (/^-{3,}\s*$/.test(line) || /^\*{3,}\s*$/.test(line)) {
      flushPara(); closeLists(); flushBlockquote();
      out.push('<hr />');
      i++;
      continue;
    }

    // --- Paragraph accumulator ---
    flushBlockquote();
    closeLists();
    para.push(line);
    i++;
  }

  flushPara();
  closeLists();
  flushBlockquote();
  return out.join('\n');
}

/** Pipe-table row split — handles leading/trailing pipes and escaped \|. */
function splitRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  const cells: string[] = [];
  let buf = '';
  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (ch === '\\' && trimmed[i + 1] === '|') { buf += '|'; i++; continue; }
    if (ch === '|') { cells.push(buf); buf = ''; continue; }
    buf += ch;
  }
  cells.push(buf);
  return cells;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inlineFmt(s: string): string {
  let text = escapeHtml(s);
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  text = text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" rel="noopener noreferrer" target="_blank">$1</a>');
  return text;
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
