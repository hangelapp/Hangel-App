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
import { useTranslation } from '@/components/providers/language-provider';

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
  const { t } = useTranslation();
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
    const labels: Record<EntityKind, string> = {
      ngo: t('ngo_admin_qr.labelNgo'),
      brand: t('ngo_admin_qr.labelBrand'),
      club: t('ngo_admin_qr.labelClub'),
    };
    return { kind: activeKind, id: activeIdFromCtx, name: activeDoc?.name || labels[activeKind] };
  }, [activeIdFromCtx, activeKind, activeDoc, t]);

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
  const shareText = activeEntity ? `${entityName} ${t('ngo_admin_qr.shareTextSuffix')}` : '';
  const shareSubject = activeEntity ? `${t('ngo_admin_qr.shareSubjectPrefix')} ${entityName}${t('ngo_admin_qr.shareSubjectSuffix')}` : '';
  const shareMessage = activeEntity
    ? `${entityName} ${t('ngo_admin_qr.shareMessageMiddle')} ${shareUrl}`
    : '';
  const entityTypeLabel = activeEntity?.kind === 'ngo' ? t('ngo_admin_qr.labelNgo') : activeEntity?.kind === 'brand' ? t('ngo_admin_qr.labelBrand') : activeEntity?.kind === 'club' ? t('ngo_admin_qr.labelClub') : '';

  const copyProfileUrl = () => {
    if (!profileUrl) return;
    navigator.clipboard.writeText(profileUrl);
    toast({ title: t('ngo_admin_qr.toastProfileCopied') });
  };

  const copyInviteUrl = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    toast({ title: t('ngo_admin_qr.toastInviteCopied') });
  };

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [imported, setImported] = useState<ImportedContact[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [manualEmail, setManualEmail] = useState('');

  const inviteSubject = activeEntity ? `${t('ngo_admin_qr.shareSubjectPrefix')} ${entityName}${t('ngo_admin_qr.shareSubjectSuffix')}` : t('ngo_admin_qr.inviteSubjectFallback');
  const inviteBody = activeEntity
    ? `${entityName} ${t('ngo_admin_qr.shareMessageMiddle')} ${inviteUrl}`
    : `${t('ngo_admin_qr.inviteBodyFallback')} ${inviteUrl}`;

  const handleContactsConnect = async () => {
    const nav = typeof navigator !== 'undefined'
      ? (navigator as unknown as { contacts?: { select?: (p: string[], o: { multiple: boolean }) => Promise<Array<{ name?: string[]; tel?: string[]; email?: string[] }>> } })
      : null;
    if (!nav?.contacts?.select) {
      toast({
        title: t('ngo_admin_qr.toastBrowserNoContacts'),
        description: t('ngo_admin_qr.toastBrowserNoContactsDesc'),
      });
      // Otomatik fallback: email/vCard dialog'unu aç — vCard/CSV upload orada
      setEmailDialogOpen(true);
      return;
    }
    try {
      const results = await nav.contacts.select(['name', 'tel', 'email'], { multiple: true });
      const mapped: ImportedContact[] = (results || []).map((c, i) => ({
        id: String(i), name: (c.name && c.name[0]) || t('ngo_admin_qr.nameUnknown'),
        phones: Array.isArray(c.tel) ? c.tel : [], emails: Array.isArray(c.email) ? c.email : [],
      }));
      if (mapped.length === 0) { toast({ variant: 'destructive', title: t('ngo_admin_qr.toastNoContactSelectedTitle'), description: t('ngo_admin_qr.toastNoContactSelectedDesc') }); return; }
      setImported(mapped); setImportDialogOpen(true);
      toast({ title: t('ngo_admin_qr.toastContactsLoadedTitle'), description: `${mapped.length} ${t('ngo_admin_qr.toastContactsLoadedDescSuffix')}` });
    } catch (err: unknown) {
      const name = (err as { name?: string } | null)?.name;
      if (name === 'InvalidStateError' || name === 'AbortError') return;
      toast({ variant: 'destructive', title: t('ngo_admin_qr.toastContactsFailedTitle'), description: t('ngo_admin_qr.toastContactsFailedDesc') });
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; e.target.value = '';
    setImportLoading(true);
    try {
      const text = await file.text();
      const parsed = file.name.toLowerCase().endsWith('.vcf') || /BEGIN:VCARD/i.test(text) ? parseVCardFile(text) : parseCSVFile(text);
      if (parsed.length === 0) { toast({ variant: 'destructive', title: t('ngo_admin_qr.toastNoContactInFileTitle'), description: t('ngo_admin_qr.toastNoContactInFileDesc') }); return; }
      // Apply localized fallback for unnamed contacts coming from parser helpers.
      const localized = parsed.map(c => c.name === 'İsimsiz' ? { ...c, name: t('ngo_admin_qr.nameUnknown') } : c);
      setImported(localized); setImportDialogOpen(true); setEmailDialogOpen(false);
      toast({ title: t('ngo_admin_qr.toastFileImportedTitle'), description: `${parsed.length} ${t('ngo_admin_qr.toastFileImportedDescSuffix')}` });
    } catch (err: unknown) {
      toast({ variant: 'destructive', title: t('ngo_admin_qr.toastFileReadFailedTitle'), description: err instanceof Error ? err.message : t('ngo_admin_qr.toastFileReadFailedDesc') });
    } finally { setImportLoading(false); }
  };

  const sendInviteToContact = (c: ImportedContact) => {
    const email = c.emails[0]; const phone = c.phones[0];
    if (email) { window.open(`mailto:${email}?subject=${encodeURIComponent(inviteSubject)}&body=${encodeURIComponent(inviteBody)}`, '_blank'); return; }
    if (phone) { window.open(`sms:${phone}?&body=${encodeURIComponent(inviteBody)}`, '_blank'); return; }
    toast({ variant: 'destructive', title: t('ngo_admin_qr.toastNoContactInfoTitle'), description: `${c.name} ${t('ngo_admin_qr.toastNoContactInfoDescSuffix')}` });
  };

  const sendManualEmailInvite = () => {
    const v = manualEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { toast({ variant: 'destructive', title: t('ngo_admin_qr.toastInvalidEmailTitle'), description: t('ngo_admin_qr.toastInvalidEmailDesc') }); return; }
    window.open(`mailto:${v}?subject=${encodeURIComponent(inviteSubject)}&body=${encodeURIComponent(inviteBody)}`, '_blank');
    setManualEmail('');
    toast({ title: t('ngo_admin_qr.toastInviteOpenedTitle'), description: `${v} ${t('ngo_admin_qr.toastInviteOpenedDescSuffix')}` });
  };

  // E-posta sağlayıcı OAuth (Gmail → google People API, Outlook → Microsoft Graph).
  const handleEmailOAuth = async (provider: 'google' | 'microsoft') => {
    if (!authUser) {
      toast({ variant: 'destructive', title: t('ngo_admin_qr.toastAuthRequiredTitle'), description: t('ngo_admin_qr.toastAuthRequiredDesc') });
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
          title: provider === 'google' ? t('ngo_admin_qr.toastGmailNotConfigured') : t('ngo_admin_qr.toastOutlookNotConfigured'),
          description: t('ngo_admin_qr.toastOauthNotConfiguredDesc'),
        });
        return;
      }
      toast({ variant: 'destructive', title: t('ngo_admin_qr.toastConnectFailedTitle'), description: data?.message ?? t('ngo_admin_qr.toastConnectFailedDesc') });
    } catch {
      toast({ variant: 'destructive', title: t('ngo_admin_qr.toastConnectFailedTitle'), description: t('ngo_admin_qr.toastConnectFailedDesc') });
    }
  };

  // OAuth popup'tan dönen kişileri içe aktarılan kişiler listesine besle.
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: string; contacts?: Array<{ name?: string; email?: string | null; phone?: string | null }>; message?: string } | null;
      if (!data || typeof data.type !== 'string') return;
      if (data.type === 'hangel-contacts-error') {
        toast({ variant: 'destructive', title: t('ngo_admin_qr.toastImportErrorTitle'), description: data.message ?? t('ngo_admin_qr.toastImportErrorDesc') });
        return;
      }
      if (data.type !== 'hangel-contacts' || !Array.isArray(data.contacts)) return;

      const mapped: ImportedContact[] = data.contacts.map((c, i) => ({
        id: `oauth-${i}`,
        name: (c.name || '').trim() || t('ngo_admin_qr.nameUnknown'),
        phones: c.phone ? [c.phone] : [],
        emails: c.email ? [c.email] : [],
      }));
      if (mapped.length === 0) {
        toast({ title: t('ngo_admin_qr.toastNoContactInOauthTitle'), description: t('ngo_admin_qr.toastNoContactInOauthDesc') });
        return;
      }
      setImported(mapped);
      setEmailDialogOpen(false);
      setImportDialogOpen(true);
      toast({ title: t('ngo_admin_qr.toastContactsImportedTitle'), description: `${mapped.length} ${t('ngo_admin_qr.toastContactsImportedDescSuffix')}` });
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [toast, t]);

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
          <h1 className="text-2xl font-bold">{t('ngo_admin_qr.pageTitle')}</h1>
          <p className="text-muted-foreground">{t('ngo_admin_qr.pageSubtitleNoEntity')}</p>
        </div>
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <ShieldAlert className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground font-medium">{t('ngo_admin_qr.noEntityTitle')}</p>
              <p className="text-sm text-muted-foreground/70 mt-1">{t('ngo_admin_qr.noEntityDesc')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 flex flex-col items-center text-center">
      <div>
        <h1 className="text-2xl font-bold">{t('ngo_admin_qr.pageTitle')}</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          {t('ngo_admin_qr.pageSubtitleEntity')}
        </p>
      </div>

      <Card className="max-w-sm w-full">
        <CardHeader>
          <CardTitle>{activeEntity.name}</CardTitle>
          <CardDescription>{entityTypeLabel} {t('ngo_admin_qr.cardSubtitleSuffix')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {qrCodeUrl && (
            <div className="bg-white p-4 rounded-lg">
              <Image src={qrCodeUrl} alt={`${activeEntity.name} ${t('ngo_admin_qr.qrAltSuffix')}`} width={200} height={200} unoptimized />
            </div>
          )}

          <div className="w-full space-y-2">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 text-left">{t('ngo_admin_qr.profileUrlLabel')}</p>
              <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-muted w-full">
                <p className="text-sm text-foreground font-mono break-all">{profileUrl}</p>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={copyProfileUrl} aria-label={t('ngo_admin_qr.copyProfileAria')}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1 text-left">{t('ngo_admin_qr.inviteUrlLabel')}</p>
              <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20 w-full">
                <p className="text-sm text-foreground font-mono break-all">{inviteUrl}</p>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={copyInviteUrl} aria-label={t('ngo_admin_qr.copyInviteAria')}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 leading-tight text-left">
                {t('ngo_admin_qr.inviteHintPrefix')} {activeEntity.kind === 'ngo' ? t('ngo_admin_qr.inviteRoleNgo') : activeEntity.kind === 'brand' ? t('ngo_admin_qr.inviteRoleBrand') : t('ngo_admin_qr.inviteRoleClub')} {t('ngo_admin_qr.inviteHintSuffix')}
              </p>
            </div>
          </div>

          <div className="w-full space-y-2">
            <div className="grid grid-cols-1 gap-2">
              <Button variant="outline" asChild disabled={!qrCodeUrl}>
                <a href={qrCodeUrl} download={`${activeEntity.id}-qr-kodu.png`}>
                  <Download className="mr-2 h-4 w-4" />
                  {t('ngo_admin_qr.downloadQr')}
                </a>
              </Button>
            </div>
            <div className="pt-2">
              <p className="text-sm font-bold text-left mb-2">{t('ngo_admin_qr.shareLabel')}</p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                <Button
                  asChild
                  variant="outline"
                  className="rounded-2xl flex-col h-auto py-3 gap-1 border-green-500/30 hover:bg-green-500/10 hover:text-green-600"
                  aria-label={t('ngo_admin_qr.shareWhatsappAria')}
                >
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(shareMessage)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="h-5 w-5 text-green-600" />
                    <span className="text-[11px] font-bold">{t('ngo_admin_qr.shareWhatsapp')}</span>
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-2xl flex-col h-auto py-3 gap-1 border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-600"
                  aria-label={t('ngo_admin_qr.shareSmsAria')}
                >
                  <a href={`sms:?body=${encodeURIComponent(shareMessage)}`}>
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                    <span className="text-[11px] font-bold">{t('ngo_admin_qr.shareSms')}</span>
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-2xl flex-col h-auto py-3 gap-1 border-sky-400/30 hover:bg-sky-400/10 hover:text-sky-500"
                  aria-label={t('ngo_admin_qr.shareTelegramAria')}
                >
                  <a
                    href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Send className="h-5 w-5 text-sky-500" />
                    <span className="text-[11px] font-bold">{t('ngo_admin_qr.shareTelegram')}</span>
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-2xl flex-col h-auto py-3 gap-1 border-muted-foreground/30 hover:bg-muted"
                  aria-label={t('ngo_admin_qr.shareEmailAria')}
                >
                  <a
                    href={`mailto:?subject=${encodeURIComponent(shareSubject)}&body=${encodeURIComponent(shareMessage)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <span className="text-[11px] font-bold">{t('ngo_admin_qr.shareEmail')}</span>
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-2xl flex-col h-auto py-3 gap-1 border-foreground/30 hover:bg-foreground hover:text-background"
                  aria-label={t('ngo_admin_qr.shareXAria')}
                >
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Twitter className="h-5 w-5" />
                    <span className="text-[11px] font-bold">{t('ngo_admin_qr.shareX')}</span>
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-2xl flex-col h-auto py-3 gap-1 border-blue-700/30 hover:bg-blue-700/10 hover:text-blue-700"
                  aria-label={t('ngo_admin_qr.shareLinkedinAria')}
                >
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Linkedin className="h-5 w-5 text-blue-700" />
                    <span className="text-[11px] font-bold">{t('ngo_admin_qr.shareLinkedin')}</span>
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="max-w-sm w-full text-left">
        <CardHeader>
          <CardTitle className="text-base">{t('ngo_admin_qr.inviteListTitle')}</CardTitle>
          <CardDescription>
            {t('ngo_admin_qr.inviteListDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="outline"
            className="rounded-2xl w-full justify-start font-bold"
            onClick={handleContactsConnect}
          >
            <BookUser className="mr-2 h-4 w-4" />
            {t('ngo_admin_qr.connectPhonebook')}
          </Button>
          <Button
            variant="outline"
            className="rounded-2xl w-full justify-start font-bold"
            onClick={() => setEmailDialogOpen(true)}
          >
            <AtSign className="mr-2 h-4 w-4" />
            {t('ngo_admin_qr.connectEmail')}
          </Button>

          <input type="file" accept=".vcf,.csv,text/vcard,text/csv" id="qr-vcard-csv-upload" className="hidden" onChange={handleFileImport} />
          <Button asChild variant="outline" className="rounded-2xl w-full justify-start font-bold" disabled={importLoading}>
            <label htmlFor="qr-vcard-csv-upload" className="cursor-pointer flex items-center w-full">
              {importLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              {t('ngo_admin_qr.uploadVcardCsv')}
            </label>
          </Button>
        </CardContent>
      </Card>

      {/* İçe Aktarılan Kişiler Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><BookUser className="h-5 w-5 text-primary" /> {t('ngo_admin_qr.importedDialogTitle')}</DialogTitle>
            <DialogDescription>{t('ngo_admin_qr.importedDialogDescPrefix')} {entityTypeLabel} {t('ngo_admin_qr.importedDialogDescSuffix')}</DialogDescription>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto space-y-2">
            {imported.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">{t('ngo_admin_qr.importedEmpty')}</p>
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
                  <Send className="mr-1 h-3 w-3" /> {t('ngo_admin_qr.sendInvite')}
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
            <DialogTitle className="flex items-center gap-2"><AtSign className="h-5 w-5 text-primary" /> {t('ngo_admin_qr.emailDialogTitle')}</DialogTitle>
            <DialogDescription>{t('ngo_admin_qr.emailDialogDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input type="email" placeholder={t('ngo_admin_qr.emailPlaceholder')} value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); sendManualEmailInvite(); } }}
              />
              <Button type="button" onClick={sendManualEmailInvite} disabled={!manualEmail.trim()}>
                <Send className="mr-1 h-4 w-4" /> {t('ngo_admin_qr.sendBtn')}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t('ngo_admin_qr.orLabel')}</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <Button type="button" variant="outline" className="w-full justify-start h-12" onClick={() => handleEmailOAuth('google')}>
              <Mail className="mr-3 h-5 w-5 text-red-500" />
              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold">{t('ngo_admin_qr.gmailLabel')}</span>
                <span className="text-[10px] text-muted-foreground">{t('ngo_admin_qr.gmailDesc')}</span>
              </div>
            </Button>
            <Button type="button" variant="outline" className="w-full justify-start h-12" onClick={() => handleEmailOAuth('microsoft')}>
              <Mail className="mr-3 h-5 w-5 text-blue-500" />
              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold">{t('ngo_admin_qr.outlookLabel')}</span>
                <span className="text-[10px] text-muted-foreground">{t('ngo_admin_qr.outlookDesc')}</span>
              </div>
            </Button>
            <input type="file" accept=".vcf,.csv,text/vcard,text/csv" id="qr-email-vcard-csv-upload" className="hidden" onChange={handleFileImport} />
            <Button asChild variant="outline" className="w-full justify-start h-12" disabled={importLoading}>
              <label htmlFor="qr-email-vcard-csv-upload" className="cursor-pointer flex items-center w-full">
                <Upload className="mr-3 h-5 w-5 text-primary" />
                <span className="text-sm font-semibold">{t('ngo_admin_qr.uploadVcardCsvShort')}</span>
              </label>
            </Button>
            <p className="text-[10px] text-muted-foreground text-center leading-relaxed pt-2 border-t">
              {t('ngo_admin_qr.emailDialogFooter')}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
