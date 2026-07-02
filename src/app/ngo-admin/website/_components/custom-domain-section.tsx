'use client';

/**
 * STK kendi alan adını (custom domain) hangel'e bağlar — Cloudflare for SaaS.
 * Domain gir → "Bağla" → gösterilen CNAME'i sağlayıcı panelinde ekle → SSL
 * otomatik üretilir. "Durumu Yenile" ile ilerlemeyi takip eder.
 */

import { useState } from 'react';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Globe, Loader2, RefreshCw, Trash2, Copy, CheckCircle2, Clock } from 'lucide-react';

type CustomDomain = {
  hostname?: string;
  status?: string;
  sslStatus?: string;
  cnameTarget?: string;
};

export function CustomDomainSection({ ngoId, initial }: { ngoId: string; initial?: CustomDomain }) {
  const { user: authUser } = useUser();
  const { toast } = useToast();
  const [domain, setDomain] = useState(initial?.hostname || '');
  const [state, setState] = useState<CustomDomain | null>(initial && initial.hostname ? initial : null);
  const [busy, setBusy] = useState<'register' | 'status' | 'remove' | null>(null);

  const call = async (action: 'register' | 'status' | 'remove') => {
    if (!authUser) { toast({ variant: 'destructive', title: 'Oturum gerekli' }); return; }
    if ((action === 'register' || action === 'status') && !domain.trim()) {
      toast({ variant: 'destructive', title: 'Alan adı girin', description: 'Örn: dernek.org' });
      return;
    }
    setBusy(action);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch('/api/ngo-admin/website/custom-domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, ngoId, domain: domain.trim() }),
      });
      const data = await res.json().catch(() => null) as { message?: string; hostname?: string; cnameTarget?: string; status?: string; sslStatus?: string; active?: boolean; removed?: boolean } | null;
      if (!res.ok) throw new Error(data?.message || 'İşlem başarısız.');
      if (action === 'remove') {
        setState(null); setDomain('');
        toast({ title: 'Alan adı kaldırıldı' });
      } else {
        setState({ hostname: data?.hostname, status: data?.status, sslStatus: data?.sslStatus, cnameTarget: data?.cnameTarget });
        toast({ title: data?.active ? 'Alan adı aktif 🧡' : 'Alan adı bağlandı', description: data?.active ? 'Siteniz kendi alan adınızda yayında.' : 'CNAME kaydını ekleyin; SSL otomatik üretilecek.' });
      }
    } catch (e) {
      toast({ variant: 'destructive', title: 'Hata', description: e instanceof Error ? e.message : '' });
    } finally {
      setBusy(null);
    }
  };

  const active = state?.status === 'active' && state?.sslStatus === 'active';

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Kendi Alan Adın (ör. dernek.org)</Label>
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="dernek.org" className="pl-9 h-11 rounded-xl" />
          </div>
          <Button onClick={() => call('register')} disabled={busy !== null} className="h-11 rounded-xl">
            {busy === 'register' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Globe className="mr-2 h-4 w-4" />}
            Bağla
          </Button>
        </div>
      </div>

      {state?.hostname && (
        <div className="rounded-2xl border p-4 space-y-3 bg-muted/20">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="font-bold">{state.hostname}</span>
            {active
              ? <Badge className="bg-green-100 text-green-700 border-green-200 gap-1"><CheckCircle2 className="h-3 w-3" /> Aktif</Badge>
              : <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1"><Clock className="h-3 w-3" /> Bekliyor (DNS/SSL)</Badge>}
          </div>

          {!active && state.cnameTarget && (
            <div className="text-sm space-y-2">
              <p className="text-muted-foreground">Alan adı sağlayıcınızın (GoDaddy, Natro, vb.) DNS panelinde şu kaydı ekleyin:</p>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-background border font-mono text-xs flex-wrap">
                <span className="font-bold">CNAME</span>
                <span className="text-muted-foreground">{state.hostname}</span>
                <span>→</span>
                <span className="text-primary">{state.cnameTarget}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto" onClick={() => { navigator.clipboard.writeText(state.cnameTarget || ''); toast({ title: 'Kopyalandı' }); }}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">DNS yayıldıktan sonra SSL sertifikası otomatik üretilir (birkaç dakika–saat). Durumu &quot;Yenile&quot; ile kontrol edin.</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => call('status')} disabled={busy !== null}>
              {busy === 'status' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Durumu Yenile
            </Button>
            <Button variant="ghost" size="sm" className="rounded-xl text-destructive" onClick={() => call('remove')} disabled={busy !== null}>
              {busy === 'remove' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Kaldır
            </Button>
          </div>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground">
        Alternatif: kendi alan adın olmadan da siten <span className="font-mono">{'{kısa-link}'}.hangel.org</span> adresinde yayında olur.
      </p>
    </div>
  );
}
