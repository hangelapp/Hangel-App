'use client';

/**
 * /super-admin/outreach/import — CSV içe aktarma
 *
 * Akış:
 *   1) CSV dosyası seç (drag & drop veya tıkla)
 *   2) Papa Parse client-side parse → header satırı + data preview
 *   3) Field mapping UI (CSV kolonu → outreach alanı)
 *   4) Preview tablosu (ilk 10 + kaç hatalı/eksik)
 *   5) "İçe Aktar" → /api/super-admin/outreach/import POST
 *   6) Result rapor (kaç eklendi, kaç atlandı)
 */

import React, { useState } from 'react';
import Link from 'next/link';
import Papa from 'papaparse';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, Upload, FileSpreadsheet, AlertCircle,
  Loader2, CheckCircle2, X, Sparkles,
} from 'lucide-react';

const TARGET_FIELDS = [
  { key: 'name', label: 'Ad *', required: true },
  { key: 'type', label: 'Tür (Vakıf/Dernek/SivilToplumMüdürlüğü/SporKulübü/MailHizmet/Diğer)' },
  { key: 'city', label: 'İl' },
  { key: 'district', label: 'İlçe' },
  { key: 'phone', label: 'Telefon' },
  { key: 'email', label: 'Email' },
  { key: 'website', label: 'Web Sitesi' },
  { key: 'address', label: 'Adres' },
  { key: 'tags', label: 'Etiketler (virgülle)' },
  { key: 'notes', label: 'Notlar' },
];

type FieldKey = typeof TARGET_FIELDS[number]['key'];

function autoMap(headers: string[]): Record<FieldKey, string> {
  const map: Record<string, string> = {};
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const aliases: Record<FieldKey, string[]> = {
    name: ['name', 'isim', 'ad', 'kurulus', 'kurulusadi', 'unvan'],
    type: ['type', 'tur', 'kategori'],
    city: ['city', 'il', 'sehir'],
    district: ['district', 'ilce'],
    phone: ['phone', 'telefon', 'tel', 'gsm', 'cep'],
    email: ['email', 'eposta', 'mail', 'iletisim'],
    website: ['website', 'web', 'url', 'site'],
    address: ['address', 'adres'],
    tags: ['tags', 'etiket', 'etiketler'],
    notes: ['notes', 'not', 'notlar', 'aciklama'],
  };
  for (const target of TARGET_FIELDS) {
    const k = target.key;
    const targetAliases = aliases[k];
    const matched = headers.find((h) => targetAliases.includes(norm(h)));
    if (matched) map[k] = matched;
  }
  return map as Record<FieldKey, string>;
}

interface Row { [k: string]: string }
interface ImportResult {
  inserted: number;
  skipped: number;
  errors: string[];
  auditId: string;
}

export default function OutreachImportPage() {
  const { user } = useUser();
  const { toast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [mapping, setMapping] = useState<Record<FieldKey, string>>({} as Record<FieldKey, string>);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  function handleFile(f: File) {
    setFile(f);
    setRows([]);
    setHeaders([]);
    setResult(null);
    setParsing(true);
    Papa.parse<Row>(f, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const data = (res.data || []).filter((r) => r && Object.keys(r).length > 0);
        const heads = res.meta?.fields || [];
        setHeaders(heads);
        setRows(data);
        setMapping(autoMap(heads));
        setParsing(false);
      },
      error: (err) => {
        toast({ title: 'CSV parse hatası', description: err.message, variant: 'destructive' });
        setParsing(false);
      },
    });
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f && (f.name.endsWith('.csv') || f.type === 'text/csv')) handleFile(f);
    else toast({ title: 'Sadece .csv dosyası', variant: 'destructive' });
  }

  const previewRows = rows.slice(0, 10);
  const validRows = rows.filter((r) => {
    const nameCol = mapping.name;
    return nameCol && r[nameCol] && r[nameCol].trim().length > 0;
  });
  const skippedCount = rows.length - validRows.length;

  async function handleImport() {
    if (!user) return;
    if (!mapping.name) {
      toast({ title: 'Ad kolonu eşleştirilmedi', variant: 'destructive' });
      return;
    }
    if (validRows.length === 0) {
      toast({ title: 'Geçerli satır yok', variant: 'destructive' });
      return;
    }
    const confirmed = window.confirm(
      `${validRows.length} kontak Firestore'a eklenecek. ${skippedCount > 0 ? `${skippedCount} satır atlanacak (ad alanı boş). ` : ''}Devam?`,
    );
    if (!confirmed) return;

    setImporting(true);
    try {
      // Mapping'i target field formatına dönüştür
      const payload = validRows.map((r) => {
        const out: Record<string, string> = {};
        for (const [target, source] of Object.entries(mapping)) {
          if (source && r[source] !== undefined) out[target] = r[source];
        }
        return out;
      });

      const token = await user.getIdToken();
      const res = await fetch('/api/super-admin/outreach/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rows: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'İçe aktarma başarısız');
      setResult(data);
      toast({ title: 'İçe aktarıldı', description: `${data.inserted} kontak eklendi` });
    } catch (e) {
      toast({ title: 'Hata', description: e instanceof Error ? e.message : 'Bilinmeyen hata', variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  }

  function reset() {
    setFile(null);
    setHeaders([]);
    setRows([]);
    setMapping({} as Record<FieldKey, string>);
    setResult(null);
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-5xl">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon">
          <Link href="/super-admin/outreach"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-headline">CSV İçe Aktar</h1>
          <p className="text-muted-foreground text-sm">Outreach kontak veritabanına toplu kayıt ekle.</p>
        </div>
      </div>

      {result && (
        <Card className={result.errors.length > 0 ? 'border-amber-300 bg-amber-50' : 'border-emerald-300 bg-emerald-50'}>
          <CardContent className="p-4 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
            <div className="text-sm space-y-1">
              <p className="font-bold">İçe aktarma tamamlandı</p>
              <p>✅ {result.inserted} eklendi · ⏭ {result.skipped} atlandı</p>
              {result.errors.length > 0 && (
                <details className="mt-1">
                  <summary className="cursor-pointer text-xs underline">Hatalar ({result.errors.length})</summary>
                  <ul className="mt-1 list-disc list-inside text-[11px] text-muted-foreground">
                    {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </details>
              )}
              <div className="pt-2 flex gap-2">
                <Button asChild size="sm" variant="outline"><Link href="/super-admin/outreach">Listeye dön</Link></Button>
                <Button size="sm" variant="ghost" onClick={reset}>Yeni içe aktarma</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!file && !result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><FileSpreadsheet className="h-5 w-5 text-primary" /> CSV Şablonu</CardTitle>
            <CardDescription>
              CSV header satırı şu alanlardan biri olmalı: name, type, city, district, phone, email, website, address, tags, notes.
              Türkçe karşılıkları (ad, tur, il, ilce, telefon, eposta, adres, etiket, notlar) da otomatik eşleştirilir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
{`name,type,city,district,phone,email,website,address,tags,notes
Kadıköy İl Sivil Toplum Müdürlüğü,SivilToplumMüdürlüğü,İstanbul,Kadıköy,02165550000,info@example.gov.tr,,Bağdat Cad. No:1,,
Galatasaray Spor Kulübü,SporKulübü,İstanbul,,02124440080,bilgi@galatasaray.org,https://galatasaray.org,,kurumsal,`}
            </pre>
          </CardContent>
        </Card>
      )}

      {!file && !result && (
        <Card
          className="border-dashed cursor-pointer hover:border-primary hover:bg-primary/5 transition"
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          onClick={() => document.getElementById('csv-input')?.click()}
        >
          <CardContent className="py-12 text-center space-y-3">
            <Upload className="h-12 w-12 text-muted-foreground/40 mx-auto" />
            <p className="font-medium">CSV dosyasını buraya bırak</p>
            <p className="text-xs text-muted-foreground">veya tıkla, dosyayı seç</p>
            <input
              id="csv-input"
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            <Button disabled={parsing}>
              {parsing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {parsing ? 'Parse ediliyor...' : 'Dosya Seç'}
            </Button>
          </CardContent>
        </Card>
      )}

      {file && rows.length > 0 && !result && (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">{file.name}</CardTitle>
                <CardDescription>
                  {rows.length.toLocaleString('tr-TR')} satır · {headers.length} kolon
                  {skippedCount > 0 && (
                    <span className="text-amber-700 ml-3">⚠ {skippedCount} satır atlanacak (ad alanı boş)</span>
                  )}
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={reset}><X className="h-4 w-4" /></Button>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Alan Eşleştirme</CardTitle>
              <CardDescription>CSV kolonlarını hangel outreach alanlarına eşle. Otomatik bulunanlar pre-fill.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {TARGET_FIELDS.map((tf) => (
                <div key={tf.key} className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
                  <label className="text-sm font-medium">
                    {tf.label}
                    {tf.required && <Badge variant="destructive" className="ml-2 text-[9px]">zorunlu</Badge>}
                  </label>
                  <select
                    value={mapping[tf.key] || ''}
                    onChange={(e) => setMapping((prev) => ({ ...prev, [tf.key]: e.target.value }))}
                    className="h-9 rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="">(eşleştirme yok)</option>
                    {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Önizleme (ilk 10 satır)</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full text-xs">
                <thead className="border-b bg-muted/30">
                  <tr>
                    {TARGET_FIELDS.map((tf) => (
                      <th key={tf.key} className="text-left px-2 py-1.5 font-bold whitespace-nowrap">
                        {tf.key}{mapping[tf.key] ? '' : <span className="opacity-40"> —</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((r, i) => (
                    <tr key={i} className="border-b">
                      {TARGET_FIELDS.map((tf) => {
                        const src = mapping[tf.key];
                        const val = src ? r[src] : '';
                        return <td key={tf.key} className="px-2 py-1 max-w-[160px] truncate">{val || <span className="text-muted-foreground/30">—</span>}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={reset}>İptal</Button>
            <Button onClick={handleImport} disabled={importing || validRows.length === 0}>
              {importing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {validRows.length.toLocaleString('tr-TR')} kontağı İçe Aktar
            </Button>
          </div>

          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="p-3 flex items-start gap-2 text-xs">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p>
                İçe aktarılan kayıtlar <code>outreachContacts</code> koleksiyonuna eklenir
                (Diğer/Manuel tab'ında görünür). Tek istekte max 5000 satır. Daha büyük dosya için
                parçalara böl.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
