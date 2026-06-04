/**
 * Client + server safe markdown → HTML renderer for contract bodies.
 *
 * Why a separate module: `loader.ts` is marked `server-only` because it
 * reads from disk. The markdown→HTML pass itself is pure string work and is
 * needed on the client too — the settings detail page (`'use client'`) reads
 * contract content straight out of Firestore where the body is stored as
 * raw markdown (see `scripts/contracts-master-sync.ts`). Without this client
 * path the page passes markdown into `sanitizeHtml` directly, which renders
 * a wall of unformatted text (no headings, no tables, no lists).
 *
 * Output is intentionally conservative; always re-vet through `sanitizeHtml`
 * before `dangerouslySetInnerHTML`.
 *
 * Supports:
 *   - YAML-style front matter (stripped — admin authors keep metadata up top)
 *   - ATX headings (`#` … `######`)
 *   - Fenced code blocks (``` … ```), optional language tag
 *   - Unordered (`-` / `*`) and ordered (`1.`) lists, one level of nesting
 *   - Pipe tables (`| col | col |` + `|---|---|`)
 *   - Multi-line blockquotes (`> …`)
 *   - Horizontal rule (`---`)
 *   - Inline: bold, italic, inline code, links
 */

/** Strip a leading `---` … `---` front matter block (master-sync stores it). */
function stripFrontMatter(raw: string): string {
  if (!raw.startsWith('---')) return raw;
  const end = raw.indexOf('\n---', 3);
  if (end === -1) return raw;
  return raw.slice(end + 4).replace(/^\s*\n/, '');
}

export function renderMarkdownToSafeHtml(md: string): string {
  const body = stripFrontMatter(md);
  const lines = body.split('\n');
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
        if (!inUl && !inOl) {
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

/**
 * Heuristic — does this string look like HTML or markdown?
 * Returns true when content already has block-level HTML tags so it can be
 * sanitized directly; false means it should be passed through
 * `renderMarkdownToSafeHtml` first.
 *
 * Used by the settings detail page where Firestore stores raw markdown
 * (master-sync) while the legacy `contractsData` fallback ships HTML.
 */
export function looksLikeHtml(input: string): boolean {
  if (!input) return false;
  return /<(p|h[1-6]|ul|ol|table|blockquote|pre|div|article)\b/i.test(input);
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
