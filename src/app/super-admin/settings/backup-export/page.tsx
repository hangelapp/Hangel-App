'use client';

/**
 * /super-admin/settings/backup-export
 *
 * Yedekleme & Dışa Aktarma — Firestore + Storage + Auth + secrets + repo
 * snapshot'ını tek arşivde indir.
 *
 * Bu sayfa şu an stub; arka planda tetiklenecek backup job henüz yok.
 */
import Link from 'next/link';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, DatabaseBackup, Download, Database, HardDrive, Shield, GitBranch, Loader2 } from 'lucide-react';

const COMPONENTS = [
  { key: 'firestore', icon: Database, label: 'Firestore', detail: 'Tüm collection\'lar + subcollection\'lar (JSON)' },
  { key: 'storage', icon: HardDrive, label: 'Firebase Storage', detail: 'Tüm bucket dosyaları (avatar, dokümanlar, app-store-assets vb.)' },
  { key: 'auth', icon: Shield, label: 'Firebase Auth', detail: 'Kullanıcı kayıtları (uid + provider + custom claims), şifreler hariç' },
  { key: 'secrets', icon: Shield, label: 'Secret Manager', detail: 'Tüm secret meta (key adları); değerler maskeli (hash only)' },
  { key: 'repo', icon: GitBranch, label: 'Repo Snapshot', detail: 'Git bundle (HEAD + tüm branch\'ler), submodule\'ler dahil' },
] as const;

export default function BackupExportPage() {
  const [generating, setGenerating] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  async function handleFullBackup() {
    setGenerating(true);
    setLastError(null);
    try {
      // TODO: gerçek endpoint /api/super-admin/full-backup'ı tetikleyecek
      await new Promise((r) => setTimeout(r, 1500));
      setLastError('Backup endpoint henüz canlıda değil — geliştirme aşamasında.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 p-4 md:p-6">
      <Link href="/super-admin/settings" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4 mr-1" /> Panel Ayarları
      </Link>

      <div>
        <h1 className="text-3xl font-black tracking-tighter">Yedekleme & Dışa Aktarma</h1>
        <p className="text-muted-foreground text-sm font-medium mt-1">
          hangel platformunun tam yedeğini tek arşivde indir.
        </p>
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-orange-600 flex items-center justify-center shrink-0">
              <DatabaseBackup className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold">Tüm hangel altyapısı — tek indirme</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Aşağıdaki 5 bileşen tek bir <code>.zip</code> arşivinde paketlenir ve sana indirilir.
                İşlem 5-30 dakika sürebilir (veri büyüklüğüne göre).
              </p>
              <Button onClick={handleFullBackup} disabled={generating} className="mt-4 bg-orange-600 hover:bg-orange-700">
                {generating
                  ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Hazırlanıyor…</>
                  : <><Download className="h-4 w-4 mr-1" /> Tam Yedek İndir</>}
              </Button>
              {lastError && <p className="text-xs text-rose-700 mt-2">{lastError}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Arşiv içeriği</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {COMPONENTS.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.key} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{c.label}</p>
                  <p className="text-xs text-muted-foreground">{c.detail}</p>
                </div>
                <Badge variant="outline" className="text-xs">Dahil</Badge>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-4 text-xs text-amber-900 space-y-2">
          <p className="font-bold">🚧 Backup motoru sırada</p>
          <p>
            UI hazır; gerçek backup orchestrator endpoint <code>/api/super-admin/full-backup</code>
            henüz canlıda değil. Geliştirme:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Firestore export: gcloud Firestore export → GCS bucket → indirilebilir signed URL</li>
            <li>Storage: bucket dosyalarını tar.gz olarak topla</li>
            <li>Auth: <code>admin.auth().listUsers()</code> → JSON dump</li>
            <li>Secret Manager: meta-only export, değerler maskeli</li>
            <li>Repo: <code>git bundle create</code> ile single-file bundle</li>
            <li>Hepsini tek arşivde birleştir, S3/GCS'e yükle, kullanıcıya signed URL ile sun</li>
            <li>Cron: günlük otomatik backup + 30 günlük retention</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
