'use client';

/**
 * /super-admin/settings/asset-links
 *
 * Android Play Store ↔ hangel.org Digital Asset Links yönetimi.
 *
 * Bu sayfa hangel.org/.well-known/assetlinks.json dosyasını yönetir:
 *   - Mevcut JSON'ı görüntüle
 *   - Play Console'dan SHA-256 fingerprint çek ve ekle
 *   - Universal Links (iOS apple-app-site-association) ile birlikte yönet
 */
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Link2, ExternalLink } from 'lucide-react';

const ASSETLINKS_TEMPLATE = `[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.hangel.app",
      "sha256_cert_fingerprints": [
        "<Play Console > Setup > App signing > App signing key certificate > SHA-256 cert fingerprint>"
      ]
    }
  }
]`;

export default function AssetLinksPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 p-4 md:p-6">
      <Link href="/super-admin/settings" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4 mr-1" /> Panel Ayarları
      </Link>

      <div>
        <h1 className="text-3xl font-black tracking-tighter">Digital Asset Links</h1>
        <p className="text-muted-foreground text-sm font-medium mt-1">
          Android uygulamanın hangel.org URL'lerini direkt açabilmesi için domain doğrulama.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-sky-500/10 flex items-center justify-center shrink-0">
              <Link2 className="h-5 w-5 text-sky-500" />
            </div>
            <div>
              <CardTitle>Mevcut durum</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                <code>hangel.org/.well-known/assetlinks.json</code>
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline" className="text-rose-600 border-rose-300">Eksik</Badge>
            <p className="text-xs text-muted-foreground">
              Play Console uyarı: "Web alanlarınız uygulamanızla ilişkilendirilmediğinden 2 derin bağlantı başarısız olabilir."
            </p>
          </div>
          <a
            href="https://hangel.org/.well-known/assetlinks.json"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm text-primary hover:underline"
          >
            assetlinks.json kontrol et <ExternalLink className="h-3 w-3 ml-1" />
          </a>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Şablon (manuel kurulum için)</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-[11px] bg-muted/30 rounded p-3 overflow-x-auto whitespace-pre-wrap break-all">{ASSETLINKS_TEMPLATE}</pre>
          <ol className="text-xs space-y-2 mt-4 list-decimal pl-5">
            <li>Play Console → Test ve sürüm → Uygulama bütünlüğü → <strong>App signing key certificate</strong> → SHA-256 fingerprint kopyala</li>
            <li>Yukarıdaki şablonda <code>&lt;...&gt;</code> yerine yapıştır</li>
            <li><code>public/.well-known/assetlinks.json</code> olarak commit + deploy</li>
            <li>Play Console &gt; Web alanları &gt; Doğrulama tetikle</li>
          </ol>
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-4 text-xs text-amber-900 space-y-2">
          <p className="font-bold">🚧 Otomasyon sırada</p>
          <p>İleride: SHA-256 fingerprint UI'dan girilebilir + assetlinks.json otomatik Firestore'a yazılır + Next.js public route ile servis eder. iOS için aynı yapı (<code>apple-app-site-association</code>) da eklenir.</p>
        </CardContent>
      </Card>
    </div>
  );
}
