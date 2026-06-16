/**
 * POST /api/ngo-admin/call-center/lists/upload
 *
 * STK admin'i kişi/üye listesini CSV veya Excel olarak yükler. Dosya parse
 * edilir, telefonlar E.164 (TR +90) formatına normalize edilir ve
 * `santralContactLists/{listId}` + `santralContacts/{contactId}` koleksiyonlarına
 * batch'ler halinde yazılır. KVKK: STK kendi tenant'ı için yazar, sadece
 * managedNgoId tenant'ına bağlanır.
 *
 * multipart/form-data:
 *   - file: CSV (.csv) veya Excel (.xlsx/.xls), <= 5 MB
 *   - listName: string (zorunlu)
 *   - description?: string
 *
 * Yanıt: { listId, total, valid, invalid, sampleInvalid }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CONTACT_LISTS = 'santralContactLists';
const CONTACTS = 'santralContacts';
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const BATCH_SIZE = 400;

const NAME_KEYS = ['ad', 'name', 'isim', 'ad soyad', 'fullname', 'adsoyad', 'isim soyisim'];
const PHONE_KEYS = ['telefon', 'phone', 'tel', 'gsm', 'cep', 'numara', 'mobile'];
const EMAIL_KEYS = ['email', 'e-posta', 'eposta', 'mail', 'e_posta'];

interface CallerContext {
  uid: string;
  ngoId: string;
}

interface InvalidRow {
  row: number;
  reason: string;
}

async function authorize(req: NextRequest): Promise<CallerContext | null> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    if (!snap.exists) return null;
    const d = snap.data() as { role?: string; managedNgoId?: string };
    if (!d?.managedNgoId) return null;
    if (d.role !== 'ngo-admin' && d.role !== 'super-admin') return null;
    return { uid: decoded.uid, ngoId: d.managedNgoId };
  } catch {
    return null;
  }
}

function normalizeKey(key: string): string {
  return key
    .toLowerCase()
    .trim()
    .replace(/[ı]/g, 'i')
    .replace(/[ç]/g, 'c')
    .replace(/[ğ]/g, 'g')
    .replace(/[ö]/g, 'o')
    .replace(/[ş]/g, 's')
    .replace(/[ü]/g, 'u');
}

function findKey(columns: string[], candidates: string[]): string | null {
  const normalizedCandidates = candidates.map(normalizeKey);
  for (const col of columns) {
    if (normalizedCandidates.includes(normalizeKey(col))) return col;
  }
  return null;
}

/**
 * TR phone normalize → E.164 (+90XXXXXXXXXX). Geçerli ise +90 ile başlayan
 * 13 haneli string döner, değilse null.
 */
function normalizePhone(raw: string): string | null {
  if (!raw) return null;
  const digits = raw.replace(/[^0-9+]/g, '');
  if (!digits) return null;

  // +90 ile başlıyorsa: tam 13 karakter olmalı (+ + 12 rakam = +90 + 10)
  if (digits.startsWith('+90')) {
    const rest = digits.slice(3);
    if (rest.length === 10 && /^[1-9]/.test(rest)) return `+90${rest}`;
    return null;
  }
  // + ile başlayan ama 90 değil → yabancı; bu görev TR için, reddet
  if (digits.startsWith('+')) return null;

  const onlyDigits = digits.replace(/^0+/, (m) => (m.length > 1 ? '0' : m));
  // 11 hane ve 0 ile başlıyor (0XXX XXX XXXX) → 0'ı at, +90 ekle
  if (onlyDigits.length === 11 && onlyDigits.startsWith('0')) {
    const rest = onlyDigits.slice(1);
    if (/^[1-9]/.test(rest)) return `+90${rest}`;
    return null;
  }
  // 10 hane (XXX XXX XXXX) → direkt +90 ekle
  if (onlyDigits.length === 10 && /^[1-9]/.test(onlyDigits)) {
    return `+90${onlyDigits}`;
  }
  // 12 hane ve 90 ile başlıyor (90XXX...) → + ekle
  if (onlyDigits.length === 12 && onlyDigits.startsWith('90')) {
    const rest = onlyDigits.slice(2);
    if (/^[1-9]/.test(rest)) return `+90${rest}`;
    return null;
  }
  return null;
}

function isValidEmail(raw: string): boolean {
  if (!raw) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.trim());
}

function parseBuffer(buffer: Buffer, fileName: string): { columns: string[]; rows: Array<Record<string, string>> } | { error: string } {
  const lower = fileName.toLowerCase();
  const isExcel = lower.endsWith('.xlsx') || lower.endsWith('.xls');

  if (isExcel) {
    try {
      const wb = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = wb.SheetNames[0];
      if (!sheetName) return { error: 'Excel dosyasında sayfa bulunamadı.' };
      const sheet = wb.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '', raw: false });
      if (json.length === 0) return { columns: [], rows: [] };
      const columns = Object.keys(json[0]);
      const rows = json.map((r) => {
        const out: Record<string, string> = {};
        for (const k of columns) out[k] = String(r[k] ?? '').trim();
        return out;
      });
      return { columns, rows };
    } catch {
      return { error: 'Excel dosyası okunamadı.' };
    }
  }

  // CSV
  try {
    const text = buffer.toString('utf-8').replace(/^\uFEFF/, '');
    const parsed = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
    });
    const columns = parsed.meta.fields ?? [];
    const rows = (parsed.data ?? []).map((r) => {
      const out: Record<string, string> = {};
      for (const k of columns) out[k] = String(r[k] ?? '').trim();
      return out;
    });
    return { columns, rows };
  } catch {
    return { error: 'CSV dosyası okunamadı.' };
  }
}

export async function POST(req: NextRequest) {
  const ctx = await authorize(req);
  if (!ctx) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'NGO admin yetkisi gerekli.' }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ errorCode: 'BAD_FORM', message: 'Geçersiz form verisi.' }, { status: 400 });
  }

  const file = form.get('file');
  const listNameRaw = form.get('listName');
  const descriptionRaw = form.get('description');

  if (!(file instanceof File)) {
    return NextResponse.json({ errorCode: 'NO_FILE', message: 'Dosya bulunamadı.' }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ errorCode: 'EMPTY_FILE', message: 'Dosya boş.' }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { errorCode: 'FILE_TOO_LARGE', message: 'Dosya en fazla 5 MB olabilir.' },
      { status: 413 },
    );
  }

  const listName = typeof listNameRaw === 'string' ? listNameRaw.trim() : '';
  const description = typeof descriptionRaw === 'string' ? descriptionRaw.trim() : '';

  if (!listName) {
    return NextResponse.json({ errorCode: 'BAD_INPUT', message: 'Liste adı zorunlu.' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = parseBuffer(buffer, file.name);
  if ('error' in parsed) {
    return NextResponse.json({ errorCode: 'PARSE_ERROR', message: parsed.error }, { status: 400 });
  }

  const { columns, rows } = parsed;
  if (rows.length === 0) {
    return NextResponse.json({ errorCode: 'EMPTY_DATA', message: 'Dosyada satır bulunamadı.' }, { status: 400 });
  }

  const nameCol = findKey(columns, NAME_KEYS);
  const phoneCol = findKey(columns, PHONE_KEYS);
  const emailCol = findKey(columns, EMAIL_KEYS);

  if (!phoneCol) {
    return NextResponse.json(
      { errorCode: 'NO_PHONE_COLUMN', message: 'Telefon kolonu bulunamadı (telefon/phone/tel/gsm/cep).' },
      { status: 400 },
    );
  }

  const customCols = columns.filter((c) => c !== nameCol && c !== phoneCol && c !== emailCol);

  const db = getAdminFirestore();
  const listRef = db.collection(CONTACT_LISTS).doc();

  const validContacts: Array<{
    name: string;
    phone: string;
    email?: string;
    customFields: Record<string, string>;
  }> = [];
  const invalidSamples: InvalidRow[] = [];
  let invalidCount = 0;

  rows.forEach((row, idx) => {
    const rowNumber = idx + 2; // header = 1, ilk veri satırı = 2
    const phoneRaw = phoneCol ? row[phoneCol] : '';
    const normalized = normalizePhone(phoneRaw);
    if (!normalized) {
      invalidCount += 1;
      if (invalidSamples.length < 5) {
        invalidSamples.push({
          row: rowNumber,
          reason: phoneRaw ? `Geçersiz telefon: "${phoneRaw}"` : 'Telefon boş',
        });
      }
      return;
    }

    const name = nameCol ? row[nameCol] : '';
    const emailRaw = emailCol ? row[emailCol] : '';
    const email = emailRaw && isValidEmail(emailRaw) ? emailRaw.trim() : undefined;

    const customFields: Record<string, string> = {};
    for (const c of customCols) {
      const v = row[c];
      if (v) customFields[c] = v;
    }

    validContacts.push({
      name: name || normalized,
      phone: normalized,
      ...(email ? { email } : {}),
      customFields,
    });
  });

  // Liste doc'unu yaz (önce); sonra batch'ler halinde contact'lar.
  await listRef.set({
    ngoId: ctx.ngoId,
    name: listName,
    description: description || null,
    sourceFileName: file.name,
    totalContacts: validContacts.length,
    importedAt: FieldValue.serverTimestamp(),
    importedBy: ctx.uid,
    status: 'active',
  });

  // Batch yazımı — 400'lük gruplar.
  for (let i = 0; i < validContacts.length; i += BATCH_SIZE) {
    const slice = validContacts.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    for (const c of slice) {
      const ref = db.collection(CONTACTS).doc();
      batch.set(ref, {
        ngoId: ctx.ngoId,
        listIds: [listRef.id],
        name: c.name,
        phone: c.phone,
        ...(c.email ? { email: c.email } : {}),
        customFields: c.customFields,
        attempts: 0,
        createdAt: FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();
  }

  return NextResponse.json({
    listId: listRef.id,
    total: rows.length,
    valid: validContacts.length,
    invalid: invalidCount,
    sampleInvalid: invalidSamples,
  });
}
