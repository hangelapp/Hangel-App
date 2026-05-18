/**
 * Minimal RFC 4180 uyumlu CSV parser — papaparse'e gerek bırakmaz.
 * Tab veya virgül ayırıcı, çift tırnak içinde escape edilmiş virgül destekler.
 */

export interface CsvParseResult {
  columns: string[];
  rows: Array<Record<string, string>>;
  rowCount: number;
  invalidLines: number;
}

const MAX_ROWS = 100_000;

export function parseCsv(text: string, opts: { delimiter?: ',' | '\t' | ';' | 'auto' } = {}): CsvParseResult {
  // eslint-disable-next-line no-irregular-whitespace
  const cleaned = text.replace(/^﻿/, ''); // BOM strip (U+FEFF)
  const lines = splitCsvLines(cleaned);
  if (lines.length === 0) return { columns: [], rows: [], rowCount: 0, invalidLines: 0 };

  const delimiter =
    opts.delimiter && opts.delimiter !== 'auto'
      ? opts.delimiter
      : detectDelimiter(lines[0]);

  const columns = splitCsvLine(lines[0], delimiter).map((c) => c.trim());
  const rows: Array<Record<string, string>> = [];
  let invalidLines = 0;

  for (let i = 1; i < lines.length && rows.length < MAX_ROWS; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const values = splitCsvLine(line, delimiter);
    if (values.length === 0) {
      invalidLines += 1;
      continue;
    }
    const row: Record<string, string> = {};
    for (let j = 0; j < columns.length; j++) {
      row[columns[j]] = (values[j] ?? '').trim();
    }
    rows.push(row);
  }

  return { columns, rows, rowCount: rows.length, invalidLines };
}

function detectDelimiter(headerLine: string): ',' | '\t' | ';' {
  const tabs = (headerLine.match(/\t/g) ?? []).length;
  const semis = (headerLine.match(/;/g) ?? []).length;
  const commas = (headerLine.match(/,/g) ?? []).length;
  if (tabs >= commas && tabs >= semis) return '\t';
  if (semis >= commas) return ';';
  return ',';
}

function splitCsvLines(text: string): string[] {
  const out: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
        current += ch;
      }
      continue;
    }
    if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      out.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  if (current) out.push(current);
  return out;
}

function splitCsvLine(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === delimiter && !inQuotes) {
      out.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  out.push(current);
  return out;
}
