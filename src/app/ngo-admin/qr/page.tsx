'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Download,
  Copy,
  Twitter,
  Linkedin,
  ShieldAlert,
  Loader2,
  MessageCircle,
  MessageSquare,
  Send,
  Mail,
  BookUser,
  AtSign,
  Upload,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useActiveEntity, useActiveEntityDoc } from '@/app/ngo-admin/active-entity-context';

interface ImportedContact {
  id: string;
  name: string;
  phones: string[];
  emails: string[];
}

function parseVCardFile(text: string): ImportedContact[] {
  const list: ImportedContact[] = [];
  for (const raw of text.split(/END:VCARD/i)) {
    if (!/BEGIN:VCARD/i.test(raw)) continue;
    let name = ''; const phones: string[] = []; const emails: string[] = [];
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^([A-Z]+)(;[^:]*)?:(.*)$/); if (!m) continue;
      const tag = m[1].toUpperCase(); const v = m[3].trim(); if (!v) continue;
      if (tag === 'FN' && !name) name = v;
      else if (tag === 'N' && !name) name = v.replace(/;/g, ' ').trim();
      else if (tag === 'TEL') phones.push(v);
      else if (tag === 'EMAIL') emails.push(v);
    }
    if (phones.length || emails.length) list.push({ id: `vcf-${list.length}-${name}`, name: name || 'İsimsiz', phones, emails });
  }
  return list;
}

function parseCSVFile(text: string): ImportedContact[] {
  const rows = text.split(/\r?\n/).map((r) => r.trim()).filter(Boolean);
  if (rows.length === 0) return [];
  const headers = rows[0].split(',').map((h) => h.trim().toLowerCase());
  const nIdx = headers.findIndex((h) => /(name|isim|ad)/i.test(h));
  const pIdx = headers.findIndex((h) => /(phone|tel|telefon|gsm|mobile|cep)/i.test(h));
  const eIdx = headers.findIndex((h) => /(mail|email|e-posta|eposta)/i.test(h));
  const data = nIdx === -1 && pIdx === -1 && eIdx === -1 ? rows : rows.slice(1);
  return data.map((r, i) => {
    const c = r.split(',').map((x) => x.trim());
    const phone = pIdx >= 0 ? c[pIdx] : c[1]; const email = eIdx >= 0 ? c[eIdx] : c[2];
    return { id: `csv-${i}`, name: (nIdx >= 0 ? c[nIdx] : c[0]) || 'İsimsiz', phones: phone ? [phone] : [], emails: email ? [email] : [] };
  }).filter((c) => c.phones.length > 0 || c.emails.length > 0);
}

type EntityKind = 'ngo' | 'brand' | 'club';
type ManagedEntity = { kind: EntityKind; id: string; name: string };

interface EntityDoc {
  id: string;
  name?: string;
  shortLink?: string;
}

export default function QrPage() {
  const { toast } = useToast();
  const { user: authUser } = useUser();
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') setOrigin(window.location.origin);
  }, []);

  // Aktif kurum — layout banner'ı ve switcher hangi kurumu seçtiyse o.
  // Manuel adminUserId+managedNgoId+[0] pattern'i terk edildi; çoklu-kurum
  // adminlerde HEP ilk kurumu döndürüyordu (active-entity-context.tsx ile çelişiyordu).
  const { id: activeIdFromCtx, kind: activeKind, isLoading: activeLoading } = useActiveEntity();
  const { data: activeDoc } = useActiveEntityDoc<EntityDoc>();

  const activeEntity = useMemo<ManagedEntity | null>(() => {
    if (!activeIdFromCtx || !activeKind) return null;
    const labels: Record<EntityKind, string> = { ngo: 'STK', brand: 'Marka', club: 'Kulüp' };
    return { kind: activeKind, id: activeIdFromCtx, name: activeDoc?.name || labels[activeKind] };
  }, [activeIdFromCtx, activeKind, activeDoc]);

  const isLoading = activeLoading;

  const profilePath = useMemo(() => {
    if (!activeEntity) return '';
    if (activeEntity.kind === 'ngo') return `/ngos/${activeEntity.id}`;
    if (activeEntity.kind === 'brand') return `/market/${activeEntity.id}`;
    return `/clubs/profile/${activeEntity.id}`;
  }, [activeEntity]);

  // Kısa link tanımlıysa profil bağlantısı odur (hangel.org.tr/s/{code}); değilse uzun yol.
  const profileUrl = origin
    ? (activeDoc?.shortLink ? `${origin}/s/${activeDoc.shortLink}` : (profilePath ? `${origin}${profilePath}` : ''))
    : '';
  // Davet URL'i: yeni kullanıcı kayıt akışına otomatik aksiyon için ref param ekliyoruz.
  // Örn: https://hangel.org.tr/login/selection?action=register&ref=ngo:abc123
  // login/selection sayfası bu paramı okuyup yeni kullanıcı dokümanına supportedNgos/joinedClubs/followedBrands yazar.
  const refParam = activeEntity ? `${activeEntity.kind}:${activeEntity.id}` : '';
  const inviteUrl = origin && refParam
    ? `${origin}/login/selection?action=register&ref=${encodeURIComponent(refParam)}`
    : '';
  // QR kodu profil (kısa) bağlantısını taşır — tarayan kişi doğrudan kurum profiline gider.
  const qrCodeUrl = profileUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(profileUrl)}`
    : '';
  const shareUrl = inviteUrl;
  const entityName = activeEntity?.name ?? '';
  const shareText = activeEntity ? `${entityName} - hangel'de bizi destekleyin` : '';
  const shareSubject = activeEntity ? `hangel'de ${entityName}'i destekleyin` : '';
  const shareMessage = activeEntity
    ? `${entityName} - hangel platformunda toplumsal etki yaratıyoruz. Bize katılın: ${shareUrl}`
    : '';
  const entityTypeLabel = activeEntity?.kind === 'ngo' ? 'STK' : activeEntity?.kind === 'brand' ? 'Marka' : activeEntity?.kind === 'club' ? 'Kulüp' : '';

  const copyProfileUrl = () => {
    if (!profileUrl) return;
    navigator.clipboard.writeText(profileUrl);
    toast({ title: 'Profil linki kopyalandı!' });
  };

  const copyInviteUrl = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    toast({ title: 'Davet linki kopyalandı!' });
  };

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [imported, setImported] = useState<ImportedContact[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [manualEmail, setManualEmail] = useState('');

  const inviteSubject = activeEntity ? `hangel'de ${entityName}'i destekleyin` : 'hangel daveti';
  const inviteBody = activeEntity
    ? `${entityName} - hangel platformunda toplumsal etki yaratıyoruz. Bize katılın: ${inviteUrl}`
    : `hangel daveti: ${inviteUrl}`;

  const handleContactsConnect = async () => {
    const nav = typeof navigator !== 'undefined'
      ? (navigator as unknown as { contacts?: { select?: (p: string[], o: { multiple: boolean }) => Promise<Array<{ name?: string[]; tel?: string[]; email?: string[] }>> } })
      : null;
    if (!nav?.contacts?.select) {
      toast({
        title: 'Tarayıcı rehber erişimini desteklemiyor',
        description: 'Mobil uygulama (Chrome Android) destekler. Vakit kaybetme — vCard/CSV upload dialog\'u açıldı.',
      });
      // Otomatik fallback: email/vCard dialog'unu aç — vCard/CSV upload orada
      setEmailDialogOpen(true);
      return;
    }
    try {
      const results = await nav.contacts.select(['name', 'tel', 'email'], { multiple: true });
      const mapped: ImportedContact[] = (results || []).map((c, i) => ({
        id: String(i), name: (c.name && c.name[0]) || 'İsimsiz',
        phones: Array.isArray(c.tel) ? c.tel : [], emails: Array.isArray(c.email) ? c.email : [],
      }));
      if (mapped.length === 0) { toast({ variant: 'destructive', title: 'Kişi seçilmedi', description: 'Rehberinizden kişi seçmediniz.' }); return; }
      setImported(mapped); setImportDialogOpen(true);
      toast({ title: 'Rehber yüklendi', description: `${mapped.length} kişi alındı.` });
    } catch (err: unknown) {
      const name = (err as { name?: string } | null)?.name;
      if (name === 'InvalidStateError' || name === 'AbortError') return;
      toast({ variant: 'destructive', title: 'Rehbere erişilemedi', description: 'İzin verilmedi veya bir hata oluştu.' });
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; e.target.value = '';
    setImportLoading(true);
    try {
      const text = await file.text();
      const parsed = file.name.toLowerCase().endsWith('.vcf') || /BEGIN:VCARD/i.test(text) ? parseVCardFile(text) : parseCSVFile(text);
      if (parsed.length === 0) { toast({ variant: 'destructive', title: 'Kişi bulunamadı', description: 'Dosya boş veya geçersiz format.' }); return; }
      setImported(parsed); setImportDialogOpen(true); setEmailDialogOpen(false);
      toast({ title: 'Dosyadan İçe Aktarıldı', description: `${parsed.length} kişi yüklendi.` });
    } catch (err: unknown) {
      toast({ variant: 'destructive', title: 'Dosya okunamadı', description: err instanceof Error ? err.message : 'Beklenmeyen bir hata.' });
    } finally { setImportLoading(false); }
  };

  const sendInviteToContact = (c: ImportedContact) => {
    const email = c.emails[0]; const phone = c.phones[0];
    if (email) { window.open(`mailto:${email}?subject=${encodeURIComponent(inviteSubject)}&body=${encodeURIComponent(inviteBody)}`, '_blank'); return; }
    if (phone) { window.open(`sms:${phone}?&body=${encodeURIComponent(inviteBody)}`, '_blank'); return; }
    toast({ variant: 'destructive', title: 'İletişim bilgisi yok', description: `${c.name} için e-posta veya telefon bulunamadı.` });
  };

  const sendManualEmailInvite = () => {
    const v = manualEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { toast({ variant: 'destructive', title: 'Geçersiz e-posta', description: 'Lütfen geçerli bir e-posta adresi girin.' }); return; }
    window.open(`mailto:${v}?subject=${encodeURIComponent(inviteSubject)}&body=${encodeURIComponent(inviteBody)}`, '_blank');
    setManualEmail('');
    toast({ title: 'Davet açıldı', description: `${v} için mail uygulamanız açıldı.` });
  };

  // E-posta sağlayıcı OAuth (Gmail → google People API, Outlook → Microsoft Graph).
  const handleEmailOAuth = async (provider: 'google' | 'microsoft') => {
    if (!authUser) {
      toast({ variant: 'destructive', title: 'Oturum gerekli', description: 'Bu özelliği kullanmak için giriş yapın.' });
      return;
    }
    try {
      const idToken = await authUser.getIdToken();
      const res = await fetch(`/api/contacts/${provider}/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = (await res.json().catch(() => null)) as { authorizeUrl?: string; errorCode?: string; message?: string } | null;
      if (res.ok && data?.authorizeUrl) {
        window.open(data.authorizeUrl, 'hangel-oauth', 'width=500,height=660');
        setEmailDialogOpen(false);
        return;
      }
      if (res.status === 503 && data?.errorCode === 'OAUTH_NOT_CONFIGURED') {
        toast({
          title: provider === 'google' ? 'Gmail bağlantısı henüz aktif değil' : 'Outlook bağlantısı henüz aktif değil',
          description: 'Kişilerini Gmail/Outlook\'tan vCard (.vcf) veya CSV olarak indir, aşağıdan yükle.',
        });
        return;
      }
      toast({ variant: 'destructive', title: 'Bağlanılamadı', description: data?.message ?? 'E-posta kişileri içe aktarılamadı. Lütfen tekrar deneyin.' });
    } catch {
      toast({ variant: 'destructive', title: 'Bağlanılamadı', description: 'E-posta kişileri içe aktarılamadı. Lütfen tekrar deneyin.' });
    }
  };

  // OAuth popup'tan dönen kişileri içe aktarılan kişiler listesine besle.
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: string; contacts?: Array<{ name?: string; email?: string | null; phone?: string | null }>; message?: string } | null;
      if (!data || typeof data.type !== 'string') return;
      if (data.type === 'hangel-contacts-error') {
        toast({ variant: 'destructive', title: 'İçe aktarılamadı', description: data.message ?? 'Kişiler alınamadı.' });
        return;
      }
      if (data.type !== 'hangel-contacts' || !Array.isArray(data.contacts)) return;

      const mapped: ImportedContact[] = data.contacts.map((c, i) => ({
        id: `oauth-${i}`,
        name: (c.name || '').trim() || 'İsimsiz',
        phones: c.phone ? [c.phone] : [],
        emails: c.email ? [c.email] : [],
      }));
      if (mapped.length === 0) {
        toast({ title: 'Kişi bulunamadı', description: 'İçe aktarılacak kişi bulunamadı.' });
        return;
      }
      setImported(mapped);
      setEmailDialogOpen(false);
      setImportDialogOpen(true);
      toast({ title: 'Kişiler içe aktarıldı', description: `${mapped.length} kişi alındı.` });
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!activeEntity) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Profil QR Kodu</h1>
          <p className="text-muted-foreground">Yönettiğiniz varlığın profil bağlantısı ve QR kodu burada görünür.</p>
        </div>
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <ShieldAlert className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground font-medium">Yönetici olduğunuz bir varlık bulunamadı.</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Lütfen sistem yöneticinize danışın.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 flex flex-col items-center text-center">
      <div>
        <h1 className="text-2xl font-bold">Profil QR Kodu</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Bu QR kodu okutarak veya linki paylaşarak profilini kolayca paylaş.
        </p>
      </div>

      <Card className="max-w-sm w-full">
        <CardHeader>
          <CardTitle>{activeEntity.name}</CardTitle>
          <CardDescription>{entityTypeLabel} Profil QR Kodu</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {qrCodeUrl && (
            <div className="bg-white p-4 rounded-lg">
              <Image src={qrCodeUrl} alt={`${activeEntity.name} QR Kodu`} width={200} height={200} unoptimized />
            </div>
          )}

          <div className="w-full space-y-2">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 text-left">Profil URL&apos;i</p>
              <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-muted w-full">
                <p className="text-sm text-foreground font-mono break-all">{profileUrl}</p>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={copyProfileUrl} aria-label="Profil bağlantısını kopyala">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1 text-left">Davet URL&apos;i (Otomatik Aksiyon)</p>
              <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20 w-full">
                <p className="text-sm text-foreground font-mono break-all">{inviteUrl}</p>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={copyInviteUrl} aria-label="Davet bağlantısını kopyala">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 leading-tight text-left">
                Bu link ile kayıt olan yeni kullanıcılar otomatik olarak {entityTypeLabel === 'STK' ? 'STK destekçisi ve gönüllüsü' : entityTypeLabel === 'Marka' ? 'marka takipçisi' : 'kulüp üyesi'} olur.
              </p>
            </div>
          </div>

          <div className="w-full space-y-2">
            <div className="grid grid-cols-1 gap-2">
              <Button variant="outline" asChild disabled={!qrCodeUrl}>
                <a href={qrCodeUrl} download={`${activeEntity.id}-qr-kodu.png`}>
                  <Download className="mr-2 h-4 w-4" />
                  QR Kodu İndir
                </a>
              </Button>
            </div>
            <div className="pt-2">
              <p className="text-sm font-bold text-left mb-2">Paylaş</p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                <Button
                  asChild
                  variant="outline"
                  className="rounded-2xl flex-col h-auto py-3 gap-1 border-green-500/30 hover:bg-green-500/10 hover:text-green-600"
                  aria-label="WhatsApp'ta paylaş"
                >
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(shareMessage)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="h-5 w-5 text-green-600" />
                    <span className="text-[11px] font-bold">WhatsApp</span>
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-2xl flex-col h-auto py-3 gap-1 border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-600"
                  aria-label="SMS ile paylaş"
                >
                  <a href={`sms:?body=${encodeURIComponent(shareMessage)}`}>
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                    <span className="text-[11px] font-bold">SMS</span>
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-2xl flex-col h-auto py-3 gap-1 border-sky-400/30 hover:bg-sky-400/10 hover:text-sky-500"
                  aria-label="Telegram'da paylaş"
                >
                  <a
                    href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Send className="h-5 w-5 text-sky-500" />
                    <span className="text-[11px] font-bold">Telegram</span>
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-2xl flex-col h-auto py-3 gap-1 border-muted-foreground/30 hover:bg-muted"
                  aria-label="E-posta ile paylaş"
                >
                  <a
                    href={`mailto:?subject=${encodeURIComponent(shareSubject)}&body=${encodeURIComponent(shareMessage)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <span className="text-[11px] font-bold">E-posta</span>
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-2xl flex-col h-auto py-3 gap-1 border-foreground/30 hover:bg-foreground hover:text-background"
                  aria-label="X (Twitter) üzerinde paylaş"
                >
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Twitter className="h-5 w-5" />
                    <span className="text-[11px] font-bold">X</span>
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-2xl flex-col h-auto py-3 gap-1 border-blue-700/30 hover:bg-blue-700/10 hover:text-blue-700"
                  aria-label="LinkedIn'de paylaş"
                >
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Linkedin className="h-5 w-5 text-blue-700" />
                    <span className="text-[11px] font-bold">LinkedIn</span>
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="max-w-sm w-full text-left">
        <CardHeader>
          <CardTitle className="text-base">Kişi Listesinden Davet Et</CardTitle>
          <CardDescription>
            Rehberini bağla, e-postanı eşle veya bir vCard/CSV dosyası yükleyerek toplu davet gönder.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="outline"
            className="rounded-2xl w-full justify-start font-bold"
            onClick={handleContactsConnect}
          >
            <BookUser className="mr-2 h-4 w-4" />
            Telefon Rehberini Bağla
          </Button>
          <Button
            variant="outline"
            className="rounded-2xl w-full justify-start font-bold"
            onClick={() => setEmailDialogOpen(true)}
          >
            <AtSign className="mr-2 h-4 w-4" />
            E-posta Adresimi Bağla
          </Button>

          <input type="file" accept=".vcf,.csv,text/vcard,text/csv" id="qr-vcard-csv-upload" className="hidden" onChange={handleFileImport} />
          <Button asChild variant="outline" className="rounded-2xl w-full justify-start font-bold" disabled={importLoading}>
            <label htmlFor="qr-vcard-csv-upload" className="cursor-pointer flex items-center w-full">
              {importLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              vCard/CSV Yükle
            </label>
          </Button>
        </CardContent>
      </Card>

      {/* İçe Aktarılan Kişiler Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><BookUser className="h-5 w-5 text-primary" /> İçe Aktarılan Kişiler</DialogTitle>
            <DialogDescription>Her bir kişiye {entityTypeLabel} davet linkini gönder.</DialogDescription>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto space-y-2">
            {imported.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Kişi bulunamadı.</p>
            ) : imported.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-2 rounded-lg border bg-background">
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar className="h-8 w-8"><AvatarFallback>{c.name[0]}</AvatarFallback></Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.emails[0] || c.phones[0] || ''}</p>
                  </div>
                </div>
                <Button size="sm" onClick={() => sendInviteToContact(c)} disabled={!c.emails[0] && !c.phones[0]}>
                  <Send className="mr-1 h-3 w-3" /> Davet Linkimi Gönder
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* E-posta Bağla Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AtSign className="h-5 w-5 text-primary" /> E-posta Adresimi Bağla</DialogTitle>
            <DialogDescription>Tek bir adrese davet gönder veya vCard/CSV yükle.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input type="email" placeholder="ornek@email.com" value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); sendManualEmailInvite(); } }}
              />
              <Button type="button" onClick={sendManualEmailInvite} disabled={!manualEmail.trim()}>
                <Send className="mr-1 h-4 w-4" /> Gönder
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">veya</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <Button type="button" variant="outline" className="w-full justify-start h-12" onClick={() => handleEmailOAuth('google')}>
              <Mail className="mr-3 h-5 w-5 text-red-500" />
              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold">Gmail</span>
                <span className="text-[10px] text-muted-foreground">Google hesabıyla bağlan</span>
              </div>
            </Button>
            <Button type="button" variant="outline" className="w-full justify-start h-12" onClick={() => handleEmailOAuth('microsoft')}>
              <Mail className="mr-3 h-5 w-5 text-blue-500" />
              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold">Outlook / Hotmail</span>
                <span className="text-[10px] text-muted-foreground">Microsoft hesabıyla bağlan</span>
              </div>
            </Button>
            <input type="file" accept=".vcf,.csv,text/vcard,text/csv" id="qr-email-vcard-csv-upload" className="hidden" onChange={handleFileImport} />
            <Button asChild variant="outline" className="w-full justify-start h-12" disabled={importLoading}>
              <label htmlFor="qr-email-vcard-csv-upload" className="cursor-pointer flex items-center w-full">
                <Upload className="mr-3 h-5 w-5 text-primary" />
                <span className="text-sm font-semibold">vCard / CSV Yükle</span>
              </label>
            </Button>
            <p className="text-[10px] text-muted-foreground text-center leading-relaxed pt-2 border-t">
              Gmail veya Outlook ile bağlanıp kişilerini içe aktar. Kişiler yalnızca davet için kullanılır; sunucularımızda saklanmaz.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
