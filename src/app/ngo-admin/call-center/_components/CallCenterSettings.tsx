'use client';

/**
 * CallCenterSettings — STK çağrı merkezi "Ayarlar" sekmesi.
 *
 * - Dahili numara tahsisi (100, 101, 102 …): her dahiliye etiket + atanan kişi.
 * - Genel ayarlar: çağrı kaydı, KVKK kayıt anonsu, görünen numara (Caller ID).
 *
 * Kaydet → POST /api/ngo-admin/call-center/settings (ngo-admin auth, admin SDK).
 * Mevcut değerler ccDoc'tan (ngoCallCenter doc) gelir; useDoc aboneliği POST sonrası tazeler.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Save, Plus, Trash2, Hash, Phone, Mic, ShieldCheck } from 'lucide-react';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

interface ExtensionRow {
  ext: string;
  label: string;
  assignedToName?: string | null;
  assignedToPhone?: string | null;
  assignedToUid?: string | null;
}
interface SettingsData {
  recordingEnabled?: boolean;
  kvkkAnnouncement?: boolean;
  callerIdNumber?: string;
}
interface CcDocLite {
  callerIdNumber?: string;
  extensions?: ExtensionRow[];
  settings?: SettingsData;
}

// hangel standart dahili planı — STK boş başlıyorsa şablon olarak gelir.
const DEFAULT_EXTENSIONS: ExtensionRow[] = [
  { ext: '100', label: 'Kullanıcı İlişkileri' },
  { ext: '101', label: 'Marka İlişkileri' },
  { ext: '102', label: 'STK İlişkileri' },
  { ext: '103', label: 'Öğrenci Kulüpleri İlişkileri' },
  { ext: '104', label: 'Kurumsal İş Birlikleri' },
  { ext: '105', label: 'Operatör' },
];

export function CallCenterSettings({ ngoId, ccDoc }: { ngoId: string; ccDoc: CcDocLite }) {
  const { user } = useUser();
  const { toast } = useToast();

  const [extensions, setExtensions] = useState<ExtensionRow[]>(
    ccDoc.extensions && ccDoc.extensions.length > 0 ? ccDoc.extensions : DEFAULT_EXTENSIONS,
  );
  const [recordingEnabled, setRecordingEnabled] = useState<boolean>(ccDoc.settings?.recordingEnabled ?? true);
  const [kvkkAnnouncement, setKvkkAnnouncement] = useState<boolean>(ccDoc.settings?.kvkkAnnouncement ?? true);
  const [callerIdNumber, setCallerIdNumber] = useState<string>(ccDoc.settings?.callerIdNumber ?? ccDoc.callerIdNumber ?? '');
  const [saving, setSaving] = useState(false);

  function updateExt(idx: number, patch: Partial<ExtensionRow>) {
    setExtensions((rows) => rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }
  function removeExt(idx: number) {
    setExtensions((rows) => rows.filter((_, i) => i !== idx));
  }
  function addExt() {
    // Bir sonraki boş dahiliyi öner (mevcut en büyük + 1, taban 100).
    const nums = extensions.map((r) => parseInt(r.ext, 10)).filter((n) => !Number.isNaN(n));
    const next = nums.length ? String(Math.max(...nums) + 1) : '100';
    setExtensions((rows) => [...rows, { ext: next, label: '', assignedToName: '', assignedToPhone: '' }]);
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    try {
      const token = await user.getIdToken();
      const cleanExt = extensions
        .map((r) => ({
          ext: r.ext.replace(/\D/g, '').slice(0, 6),
          label: (r.label || '').trim(),
          assignedToName: (r.assignedToName || '').trim() || null,
          assignedToPhone: (r.assignedToPhone || '').trim() || null,
          assignedToUid: r.assignedToUid ?? null,
        }))
        .filter((r) => r.ext);
      const res = await fetch('/api/ngo-admin/call-center/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          extensions: cleanExt,
          settings: { recordingEnabled, kvkkAnnouncement, callerIdNumber: callerIdNumber.trim() },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast({ variant: 'destructive', title: 'Kaydedilemedi', description: data.message || 'Ayarlar kaydedilemedi.' });
        return;
      }
      toast({ title: 'Ayarlar kaydedildi 🧡' });
    } catch {
      toast({ variant: 'destructive', title: 'Hata', description: 'Ayarlar kaydedilemedi, tekrar deneyin.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Dahili Numara Tahsisi */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Hash className="h-5 w-5 text-emerald-600" /> Dahili Numaralar
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Her dahili numarayı (100, 101, …) bir birime/kişiye atayın. Gelen aramalar IVR menüsünde bu dahililere yönlendirilir.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {extensions.map((row, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-[80px_1fr_1fr_1fr_auto] gap-2 items-center rounded-md border p-2.5">
              <Input
                value={row.ext}
                onChange={(e) => updateExt(idx, { ext: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                placeholder="100"
                inputMode="numeric"
                className="font-mono text-center"
                aria-label="Dahili numara"
              />
              <Input
                value={row.label}
                onChange={(e) => updateExt(idx, { label: e.target.value })}
                placeholder="Birim / departman (örn. STK İlişkileri)"
                aria-label="Dahili etiketi"
              />
              <Input
                value={row.assignedToName ?? ''}
                onChange={(e) => updateExt(idx, { assignedToName: e.target.value })}
                placeholder="Atanan kişi (ad soyad)"
                aria-label="Atanan kişi"
              />
              <Input
                value={row.assignedToPhone ?? ''}
                onChange={(e) => updateExt(idx, { assignedToPhone: e.target.value })}
                placeholder="Telefon (opsiyonel)"
                inputMode="tel"
                aria-label="Atanan telefon"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeExt(idx)}
                aria-label="Dahiliyi kaldır"
                className="text-muted-foreground hover:text-rose-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addExt}>
            <Plus className="h-4 w-4 mr-1.5" /> Dahili Ekle
          </Button>
        </CardContent>
      </Card>

      {/* Genel Ayarlar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" /> Genel Ayarlar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="callerId" className="flex items-center gap-1.5">
              <Phone className="h-4 w-4 text-muted-foreground" /> Görünen Numara (Caller ID)
            </Label>
            <Input
              id="callerId"
              value={callerIdNumber}
              onChange={(e) => setCallerIdNumber(e.target.value)}
              placeholder="0216 708 0216"
              className="max-w-xs font-mono"
            />
            <p className="text-[11px] text-muted-foreground">Dışarı aramalarda karşı tarafta görünecek numara.</p>
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer text-sm">
            <Checkbox checked={recordingEnabled} onCheckedChange={(v) => setRecordingEnabled(v === true)} aria-label="Çağrı kaydı" />
            <span className="flex items-center gap-1.5">
              <Mic className="h-4 w-4 text-muted-foreground" />
              <span>
                <strong>Çağrı kaydı</strong> — görüşmeler kaydedilsin (yalnızca STK erişir, 6 ay sonra otomatik silinir).
              </span>
            </span>
          </label>

          <label className="flex items-start gap-2.5 cursor-pointer text-sm">
            <Checkbox checked={kvkkAnnouncement} onCheckedChange={(v) => setKvkkAnnouncement(v === true)} aria-label="KVKK anonsu" />
            <span>
              <strong>KVKK kayıt anonsu</strong> — görüşme başında &quot;bu çağrı kayıt altına alınmaktadır&quot; anonsu çalsın (zorunluluk).
            </span>
          </label>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Ayarları Kaydet
        </Button>
      </div>

      <p className="text-[11px] text-muted-foreground">STK: {ngoId}</p>
    </div>
  );
}
