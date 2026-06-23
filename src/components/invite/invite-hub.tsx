'use client';

/**
 * InviteHub — paylaşılan davet bileşeni (Apple iOS tasarım dili + hangel renkleri).
 *
 * İKİ sayfa da bunu kullanır (değişiklik tek yerde, iki sayfayı kapsar):
 *   - /invite                      → kullanıcı "Arkadaşını Davet Et"
 *   - /ngo-admin/community-invite  → kurumsal "Topluluğunu Davet Et"
 *
 * Fark sadece context (props): davet linki/metni, paylaşım konusu ve davet
 * kaydına eklenen alanlar (recordExtra). Rehber bağlama, Gmail/Outlook OAuth,
 * hangel kullanıcı eşleştirme (privacy-preserving hash), tek tek + toplu
 * SMS/WhatsApp daveti — hepsi burada.
 *
 * Görsel dil: iOS HIG — systemGroupedBackground (#f5f5f7), beyaz inset-grouped
 * kartlar (rounded-3xl), squircle app-icon hero, segmented control, tinted
 * aksiyon daireleri, active:scale dokunma geri bildirimi. Aksan: hangel #f34723.
 */

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { isNativeApp } from '@/lib/capacitor';
import { matchHangelUsers, type MatchableContact } from '@/lib/contacts/match-hangel-users';
import { Input } from '@/components/ui/input';
import {
    Mail,
    Send,
    MessageSquare,
    MessageCircle,
    Copy,
    Twitter,
    Linkedin,
    Gift,
    Smartphone,
    Contact,
    ArrowDownUp,
    Loader2,
    AtSign,
    Plus,
    X,
    Upload,
    Check,
    ChevronRight,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { COLLECTIONS } from '@/firebase/collections';
import { cn } from '@/lib/utils';

const INVITE_POINTS = 10;

export interface InviteHubProps {
    inviteLink: string;
    inviteMessage: string;
    heroTitle: string;
    heroSubtitle: string;
    shareSubject?: string;
    recordExtra?: Record<string, unknown>;
    heroIcon?: React.ElementType;
}

interface PhoneContact {
    id: string;
    name: string;
    phones: string[];
    avatarUrl?: string;
    onPlatform?: boolean;
    impactScore?: number;
    joinDate?: string;
}

interface ImportedContact {
    id: string;
    name: string;
    phones: string[];
    emails: string[];
    onPlatform?: boolean;
}

// wa.me için uluslararası rakam dizisi (+ ve ülke kodu dahil, '+' olmadan).
function toIntlDigits(raw: string): string {
    const trimmed = (raw || '').trim();
    const digits = trimmed.replace(/\D/g, '');
    if (!digits) return '';
    if (trimmed.startsWith('+')) return digits;
    if (digits.startsWith('90')) return digits;
    const noZero = digits.replace(/^0+/, '');
    return '90' + noZero;
}

interface CapacitorContact {
    contactId?: string;
    name?: { display?: string };
    phones?: Array<{ number?: string }>;
}

interface WebContact {
    name?: string[];
    tel?: string[] | string;
}

type ContactsPermissionState = 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale' | 'limited';

class ContactsPermissionDeniedError extends Error {
    constructor(message = 'Rehber izni reddedildi.') {
        super(message);
        this.name = 'ContactsPermissionDeniedError';
    }
}

async function getCapacitorContacts(): Promise<PhoneContact[]> {
    let mod: {
        Contacts: {
            getContacts: (opts: unknown) => Promise<{ contacts: CapacitorContact[] }>;
            checkPermissions?: () => Promise<{ contacts: ContactsPermissionState }>;
            requestPermissions?: () => Promise<{ contacts: ContactsPermissionState }>;
        };
    };
    try {
        mod = (await import('@capacitor-community/contacts')) as unknown as typeof mod;
    } catch (err) {
        console.error('Contacts plugin import failed:', err);
        throw new Error('Rehber eklentisi yüklenemedi.', { cause: err });
    }

    const { Contacts } = mod;

    if (typeof Contacts.requestPermissions === 'function') {
        try {
            const status = await Contacts.requestPermissions();
            if (status.contacts !== 'granted' && status.contacts !== 'limited') {
                throw new ContactsPermissionDeniedError();
            }
        } catch (err) {
            if (err instanceof ContactsPermissionDeniedError) throw err;
            console.error('Contacts permission request failed:', err);
            throw new ContactsPermissionDeniedError('Rehber izni alınamadı.');
        }
    }

    const { contacts } = await Contacts.getContacts({
        projection: { name: true, phones: true, image: false },
    });

    return (contacts as CapacitorContact[])
        .filter((c) => c.name?.display)
        .map((c) => ({
            id: c.contactId || String(Math.random()),
            name: c.name!.display!,
            phones: (c.phones || []).map((p) => p.number).filter((n): n is string => Boolean(n)),
            onPlatform: false,
        }));
}

async function getWebContacts(): Promise<PhoneContact[] | null> {
    const nav = typeof navigator !== 'undefined' ? (navigator as unknown as { contacts?: { select?: (props: string[], opts: { multiple: boolean }) => Promise<WebContact[]> } }) : null;
    if (!nav?.contacts?.select) return null;
    const results = await nav.contacts.select(['name', 'tel'], { multiple: true });
    return (results || []).map((c: WebContact, i: number) => ({
        id: String(i),
        name: (c.name && c.name[0]) || 'İsimsiz',
        phones: Array.isArray(c.tel) ? c.tel : [],
        onPlatform: false,
    }));
}

function parseVCard(text: string): PhoneContact[] {
    const cards = text.split(/END:VCARD/i);
    const contacts: PhoneContact[] = [];
    for (const raw of cards) {
        if (!/BEGIN:VCARD/i.test(raw)) continue;
        const lines = raw.split(/\r?\n/);
        let name = '';
        const phones: string[] = [];
        for (const line of lines) {
            const m = line.match(/^([A-Z]+)(;[^:]*)?:(.*)$/);
            if (!m) continue;
            const tag = m[1].toUpperCase();
            const value = m[3].trim();
            if (!value) continue;
            if (tag === 'FN' && !name) name = value;
            if (tag === 'N' && !name) name = value.replace(/;/g, ' ').trim();
            if (tag === 'TEL') phones.push(value);
        }
        if (phones.length > 0) {
            contacts.push({ id: `vcf-${contacts.length}-${name}`, name: name || 'İsimsiz', phones, onPlatform: false });
        }
    }
    return contacts;
}

function parseCSV(text: string): PhoneContact[] {
    const rows = text.split(/\r?\n/).map(r => r.trim()).filter(Boolean);
    if (rows.length === 0) return [];
    const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
    const nameIdx = headers.findIndex(h => /(name|isim|ad)/i.test(h));
    const phoneIdx = headers.findIndex(h => /(phone|tel|telefon|gsm|mobile|cep)/i.test(h));
    if (nameIdx === -1 && phoneIdx === -1) {
        return rows.map((r, i) => {
            const cells = r.split(',').map(c => c.trim());
            return { id: `csv-${i}`, name: cells[0] || 'İsimsiz', phones: cells[1] ? [cells[1]] : [], onPlatform: false };
        }).filter(c => c.phones.length > 0);
    }
    return rows.slice(1).map((r, i) => {
        const cells = r.split(',').map(c => c.trim());
        return {
            id: `csv-${i}`,
            name: (nameIdx >= 0 ? cells[nameIdx] : '') || 'İsimsiz',
            phones: phoneIdx >= 0 && cells[phoneIdx] ? [cells[phoneIdx]] : [],
            onPlatform: false,
        };
    }).filter(c => c.phones.length > 0);
}

export function InviteHub({
    inviteLink,
    inviteMessage,
    heroTitle,
    heroSubtitle,
    shareSubject = 'hangel daveti',
    recordExtra,
    heroIcon: HeroIcon = Gift,
}: InviteHubProps) {
    const { toast } = useToast();
    const { user: authUser } = useUser();
    const db = useFirestore();
    const [sortCriteria, setSortCriteria] = useState('alphabetical');
    const [copied, setCopied] = useState(false);

    const [phoneContacts, setPhoneContacts] = useState<PhoneContact[]>([]);
    const [phoneLoading, setPhoneLoading] = useState(false);
    const [phoneSynced, setPhoneSynced] = useState(false);

    const [emailInput, setEmailInput] = useState('');
    const [emailList, setEmailList] = useState<string[]>([]);
    const [emailSending, setEmailSending] = useState(false);

    const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false);
    const [emailProviderDialogOpen, setEmailProviderDialogOpen] = useState(false);
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [importedContacts, setImportedContacts] = useState<ImportedContact[]>([]);

    const copyToClipboard = async () => {
        if (!inviteLink) return;
        try { await navigator.clipboard.writeText(inviteLink); } catch { /* yoksay */ }
        setCopied(true);
        toast({ title: 'Davet linki kopyalandı!' });
        window.setTimeout(() => setCopied(false), 1800);
    };

    const recordInvite = async (recipientName: string, recipientPhone?: string | null, recipientEmail?: string | null) => {
        if (!authUser?.uid) return 0;
        try {
            await addDoc(collection(db, COLLECTIONS.invites), {
                invitedBy: authUser.uid,
                ...(recordExtra ?? { kind: 'friend' }),
                recipientName,
                recipientPhone: recipientPhone || null,
                recipientEmail: recipientEmail || null,
                sentAt: serverTimestamp(),
                status: 'sent',
                pointsAwarded: INVITE_POINTS,
            });
            await updateDoc(doc(db, COLLECTIONS.users, authUser.uid), {
                inviteCount: increment(1),
                impactScore: increment(INVITE_POINTS),
            });
            return INVITE_POINTS;
        } catch (error) {
            console.error('Failed to track invite:', error);
            return 0;
        }
    };

    const openInviteChannel = (phone: string, channel: 'sms' | 'whatsapp') => {
        const msg = encodeURIComponent(inviteMessage);
        if (channel === 'whatsapp') {
            const intl = toIntlDigits(phone);
            window.open(intl ? `https://wa.me/${intl}?text=${msg}` : `https://wa.me/?text=${msg}`, '_blank', 'noopener,noreferrer');
        } else {
            const safe = phone.replace(/[^\d+]/g, '');
            window.open(`sms:${safe}?body=${msg}`, '_blank');
        }
    };

    const handleInvitePhone = async (name: string, phone: string | undefined, channel: 'sms' | 'whatsapp') => {
        if (phone && inviteLink) openInviteChannel(phone, channel);
        const awarded = await recordInvite(name, phone, null);
        toast({
            title: channel === 'whatsapp' ? 'WhatsApp Daveti Açıldı' : 'SMS Daveti Açıldı',
            description: awarded
                ? `${name} kişisine davet açıldı. +${awarded} Etki Puanı kazandınız.`
                : `${name} kişisine hangel davetiniz açıldı.`,
        });
    };

    const markOnPlatform = async <T extends MatchableContact>(list: T[]): Promise<T[]> => {
        if (!authUser || list.length === 0) return list.map((c) => ({ ...c, onPlatform: false }));
        try {
            const idToken = await authUser.getIdToken();
            const matchMap = await matchHangelUsers(
                list.map((c) => ({ id: c.id, phones: c.phones, emails: c.emails })),
                idToken,
            );
            return list.map((c) => ({ ...c, onPlatform: Boolean(matchMap[c.id]) }));
        } catch (err) {
            console.error('[invite] kişi eşleştirme başarısız:', err);
            return list.map((c) => ({ ...c, onPlatform: false }));
        }
    };

    const handleBulkSms = async (targets: { name: string; phone?: string }[]) => {
        const valid = targets.filter((t) => t.phone && t.phone.replace(/[^\d+]/g, ''));
        const recipients = valid.map((t) => t.phone!.replace(/[^\d+]/g, ''));
        if (recipients.length === 0) {
            toast({ variant: 'destructive', title: 'Numara yok', description: 'Davet edilecek telefon numarası bulunamadı.' });
            return;
        }
        const msg = encodeURIComponent(inviteMessage);
        window.open(`sms:${recipients.join(',')}?body=${msg}`, '_blank');
        const awards = await Promise.all(valid.map((t) => recordInvite(t.name, t.phone, null)));
        const total = awards.reduce<number>((a, b) => a + b, 0);
        toast({
            title: 'Toplu SMS Daveti Açıldı',
            description: `${recipients.length} kişiye davet SMS'i hazırlandı.${total ? ` +${total} Etki Puanı kazandınız.` : ''}`,
        });
    };

    const handleBulkWhatsApp = async () => {
        try { await navigator.clipboard.writeText(inviteMessage); } catch { /* clipboard izni yoksa yoksay */ }
        window.open(`https://wa.me/?text=${encodeURIComponent(inviteMessage)}`, '_blank', 'noopener,noreferrer');
        toast({
            title: 'WhatsApp Paylaşımı Açıldı',
            description: 'WhatsApp toplu alıcı desteklemez — kişi veya grup seçerek gönderin. Davet metni panoya kopyalandı.',
        });
    };

    const sendInviteToImported = async (c: ImportedContact, channel: 'sms' | 'whatsapp' | 'email') => {
        const email = c.emails[0];
        const phone = c.phones[0];
        if (channel === 'email' && email) {
            window.open(`mailto:${email}?subject=${encodeURIComponent(shareSubject)}&body=${encodeURIComponent(inviteMessage)}`, '_blank');
            const awarded = await recordInvite(c.name, null, email);
            toast({
                title: 'Mail Daveti Açıldı',
                description: awarded
                    ? `${c.name} kişisine davet açıldı. +${awarded} Etki Puanı kazandınız.`
                    : `${c.name} kişisine hangel davetiniz açıldı.`,
            });
            return;
        }
        if ((channel === 'sms' || channel === 'whatsapp') && phone) {
            await handleInvitePhone(c.name, phone, channel);
            return;
        }
        toast({ variant: 'destructive', title: 'İletişim bilgisi yok', description: `${c.name} için bu kanal kullanılamıyor.` });
    };

    const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

    const handleEmailAdd = () => {
        const value = emailInput.trim();
        if (!value) return;
        const candidates = value.split(/[\s,;]+/).map(s => s.trim()).filter(Boolean);
        const valid: string[] = [];
        const invalid: string[] = [];
        candidates.forEach(c => (isValidEmail(c) ? valid.push(c) : invalid.push(c)));
        if (invalid.length > 0) {
            toast({ variant: 'destructive', title: 'Geçersiz adres', description: invalid.join(', ') });
        }
        if (valid.length > 0) {
            setEmailList(prev => Array.from(new Set([...prev, ...valid])));
            setEmailInput('');
        }
    };

    const handleEmailRemove = (email: string) => {
        setEmailList(prev => prev.filter(e => e !== email));
    };

    const handleEmailSend = async () => {
        if (!inviteLink) return;
        if (emailList.length === 0) {
            toast({ variant: 'destructive', title: 'Adres ekleyin', description: 'En az bir mail adresi ekleyin.' });
            return;
        }
        setEmailSending(true);
        try {
            const subject = encodeURIComponent(shareSubject);
            const body = encodeURIComponent(inviteMessage);
            if (emailList.length === 1) {
                window.open(`mailto:${encodeURIComponent(emailList[0])}?subject=${subject}&body=${body}`, '_blank');
            } else {
                const bcc = encodeURIComponent(emailList.join(','));
                window.open(`mailto:?bcc=${bcc}&subject=${subject}&body=${body}`, '_blank');
            }
            const awards = await Promise.all(emailList.map((email) => recordInvite(email, null, email)));
            const total = awards.reduce<number>((a, b) => a + b, 0);
            toast({
                title: 'Mail Davetleri Hazırlandı',
                description: `${emailList.length} adrese davet açıldı.${total ? ` +${total} Etki Puanı kazandınız.` : ''}`,
            });
            setEmailList([]);
        } finally {
            setEmailSending(false);
        }
    };

    const handlePhoneSync = async () => {
        setPhoneLoading(true);
        try {
            let contacts: PhoneContact[] = [];

            if (isNativeApp()) {
                try {
                    contacts = await getCapacitorContacts();
                } catch (err) {
                    const isPermDenied = err instanceof Error && err.name === 'ContactsPermissionDeniedError';
                    console.error('Capacitor contacts failed:', err);
                    toast({
                        variant: 'destructive',
                        title: isPermDenied ? 'Rehber izni gerekli' : 'Rehbere erişilemedi',
                        description: isPermDenied
                            ? 'Uygulama ayarlarından hangel için rehber iznini açın ve tekrar deneyin.'
                            : 'Beklenmeyen bir hata oluştu. Daha sonra tekrar deneyin.',
                    });
                    return;
                }
            } else {
                try {
                    const webContacts = await getWebContacts();
                    if (webContacts === null) {
                        toast({
                            variant: 'destructive',
                            title: 'Tarayıcınız desteklemiyor',
                            description: 'Rehber senkronizasyonu için mobil uygulamayı kullanın veya bağlantıyı manuel paylaşın.',
                        });
                        return;
                    }
                    contacts = webContacts;
                } catch (err: unknown) {
                    const name = (err as { name?: string } | null)?.name;
                    if (name === 'InvalidStateError' || name === 'AbortError') return;
                    console.error('Web contacts failed:', err);
                    toast({ variant: 'destructive', title: 'Rehbere erişilemedi', description: 'İzin verilmedi veya bir hata oluştu.' });
                    return;
                }
            }

            if (contacts.length === 0) {
                toast({ variant: 'destructive', title: 'Kişi bulunamadı', description: 'Rehberinizde kişi yok veya hiçbiri seçilmedi.' });
                return;
            }

            const enriched = await markOnPlatform(contacts);
            setPhoneContacts(enriched);
            setPhoneSynced(true);
            setImportedContacts(enriched.map(c => ({ id: c.id, name: c.name, phones: c.phones, emails: [], onPlatform: c.onPlatform })));
            setImportDialogOpen(true);
            const matchedCount = enriched.filter(c => c.onPlatform).length;
            toast({
                title: 'Rehber Senkronize Edildi',
                description: `${enriched.length} kişi yüklendi${matchedCount ? `, ${matchedCount} kişi hangel'da` : ''}.`,
            });
        } finally {
            setPhoneLoading(false);
        }
    };

    const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';

        setPhoneLoading(true);
        try {
            const text = await file.text();
            const parsed = file.name.toLowerCase().endsWith('.vcf') || /BEGIN:VCARD/i.test(text)
                ? parseVCard(text)
                : parseCSV(text);

            if (parsed.length === 0) {
                toast({ variant: 'destructive', title: 'Kişi bulunamadı', description: 'Dosya boş veya geçersiz format.' });
                return;
            }

            const enriched = await markOnPlatform(parsed);
            setPhoneContacts(enriched);
            setPhoneSynced(true);
            setImportedContacts(enriched.map(c => ({ id: c.id, name: c.name, phones: c.phones, emails: [], onPlatform: c.onPlatform })));
            setImportDialogOpen(true);
            toast({ title: 'Dosyadan İçe Aktarıldı', description: `${enriched.length} kişi yüklendi.` });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Beklenmeyen bir hata.';
            toast({ variant: 'destructive', title: 'Dosya okunamadı', description: message });
        } finally {
            setPhoneLoading(false);
        }
    };

    const shareOptions = [
        { name: 'WhatsApp', icon: MessageSquare, tint: 'bg-[#25D366]/12 text-[#1c9b4b]', href: `https://wa.me/?text=${encodeURIComponent(inviteMessage)}` },
        { name: 'SMS', icon: Smartphone, tint: 'bg-primary/10 text-primary', href: `sms:?body=${encodeURIComponent(inviteMessage)}` },
        { name: 'Telegram', icon: Send, tint: 'bg-[#229ED9]/12 text-[#1c86bb]', href: `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(inviteMessage)}` },
        { name: 'E-posta', icon: Mail, tint: 'bg-secondary text-foreground/70', href: `mailto:?subject=${encodeURIComponent(shareSubject)}&body=${encodeURIComponent(inviteMessage)}` },
        { name: 'X', icon: Twitter, tint: 'bg-foreground/8 text-foreground', href: `https://x.com/intent/tweet?text=${encodeURIComponent(inviteMessage)}` },
        { name: 'LinkedIn', icon: Linkedin, tint: 'bg-[#0A66C2]/12 text-[#0a5cb0]', href: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(inviteLink)}&title=${encodeURIComponent(inviteMessage)}` },
    ];

    const sortedPhoneContacts = useMemo(() => {
        const byName = (a: PhoneContact, b: PhoneContact) => a.name.localeCompare(b.name, 'tr');
        const onPlatform = phoneContacts.filter(c => c.onPlatform).sort(byName);
        const offPlatform = phoneContacts.filter(c => !c.onPlatform).sort(byName);
        const sorted = [...onPlatform, ...offPlatform];
        if (sortCriteria === 'alphabetical') sorted.sort(byName);
        return sorted;
    }, [phoneContacts, sortCriteria]);

    const handlePhoneConnect = async () => {
        if (isNativeApp()) {
            await handlePhoneSync();
            return;
        }
        const nav = typeof navigator !== 'undefined' ? (navigator as unknown as { contacts?: { select?: unknown } }) : null;
        if (!nav?.contacts?.select) {
            toast({
                title: 'Tarayıcı rehber erişimini desteklemiyor',
                description: 'Mobil uygulamayı kullanın veya vCard/CSV dosyası yükleyin (otomatik açıldı).',
            });
            if (typeof document !== 'undefined') {
                (document.getElementById('main-vcard-csv-upload') as HTMLInputElement | null)?.click();
            }
            return;
        }
        await handlePhoneSync();
    };

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
                setEmailProviderDialogOpen(false);
                return;
            }
            if (res.status === 503 && data?.errorCode === 'OAUTH_NOT_CONFIGURED') {
                toast({
                    title: provider === 'google' ? 'Gmail bağlantısı henüz aktif değil' : 'Outlook bağlantısı henüz aktif değil',
                    description: 'Şimdilik kişilerini Gmail/Outlook\'tan vCard (.vcf) veya CSV olarak indir ve aşağıdan yükle.',
                });
                if (provider === 'microsoft') {
                    toast({ title: 'Outlook kişilerini dışa aktar', description: 'outlook.live.com → People → Manage → Export' });
                }
                if (typeof document !== 'undefined') {
                    (document.getElementById('email-vcard-csv-upload') as HTMLInputElement | null)?.click();
                }
                return;
            }
            toast({ variant: 'destructive', title: 'Bağlanılamadı', description: data?.message ?? 'E-posta kişileri içe aktarılamadı. Lütfen tekrar deneyin.' });
        } catch {
            toast({ variant: 'destructive', title: 'Bağlanılamadı', description: 'E-posta kişileri içe aktarılamadı. Lütfen tekrar deneyin.' });
        }
    };

    const handleImapNote = () => {
        toast({
            title: 'IMAP ile kişi içe aktarma yok',
            description: 'Kurumsal/özel maillerde kişileri vCard (.vcf) veya CSV olarak dışa aktarıp aşağıdan yükleyin.',
        });
        if (typeof document !== 'undefined') {
            (document.getElementById('email-vcard-csv-upload') as HTMLInputElement | null)?.click();
        }
    };

    // OAuth popup'tan (Gmail / Outlook) dönen kişileri davet listelerine besle.
    React.useEffect(() => {
        const handler = async (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;
            const data = event.data as { type?: string; contacts?: Array<{ name?: string; email?: string | null; phone?: string | null }>; message?: string } | null;
            if (!data || typeof data.type !== 'string') return;

            if (data.type === 'hangel-contacts-error') {
                toast({ variant: 'destructive', title: 'İçe aktarılamadı', description: data.message ?? 'Kişiler alınamadı.' });
                return;
            }
            if (data.type !== 'hangel-contacts' || !Array.isArray(data.contacts)) return;

            const emailEntries: string[] = [];
            const imported: ImportedContact[] = [];
            data.contacts.forEach((c, i) => {
                const name = (c.name || '').trim() || 'İsimsiz';
                const phone = (c.phone || '').trim();
                const email = (c.email || '').trim();
                const validEmail = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
                if (validEmail) emailEntries.push(validEmail);
                if (phone || validEmail) {
                    imported.push({
                        id: `oauth-${i}-${name}`,
                        name,
                        phones: phone ? [phone] : [],
                        emails: validEmail ? [validEmail] : [],
                        onPlatform: false,
                    });
                }
            });

            if (imported.length === 0) {
                toast({ title: 'Kişi bulunamadı', description: 'İçe aktarılacak telefon veya e-posta bulunamadı.' });
                return;
            }

            const matched = await markOnPlatform(imported);

            const phoneEntries: PhoneContact[] = matched
                .filter(c => c.phones.length > 0)
                .map(c => ({ id: c.id, name: c.name, phones: c.phones, onPlatform: c.onPlatform }));
            if (phoneEntries.length > 0) {
                setPhoneContacts(prev => {
                    const seen = new Set(prev.map(p => p.id));
                    return [...prev, ...phoneEntries.filter(p => !seen.has(p.id))];
                });
                setPhoneSynced(true);
            }
            if (emailEntries.length > 0) {
                setEmailList(prev => Array.from(new Set([...prev, ...emailEntries])));
            }

            setImportedContacts(matched);
            setEmailProviderDialogOpen(false);
            setImportDialogOpen(true);
            const matchedCount = matched.filter(c => c.onPlatform).length;
            toast({ title: 'Kişiler içe aktarıldı', description: `${matched.length} kişi eklendi${matchedCount ? `, ${matchedCount} kişi hangel'da` : ''}.` });
        };
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- markOnPlatform/toast stable enough
    }, [authUser, toast]);

    const handleCopyWhatsappMessage = async () => {
        if (!inviteMessage) return;
        try {
            await navigator.clipboard.writeText(inviteMessage);
            toast({ title: 'Mesaj kopyalandı!', description: "Şimdi WhatsApp'ta yapıştırıp gönderebilirsin." });
        } catch {
            toast({ variant: 'destructive', title: 'Kopyalanamadı', description: 'Tarayıcı izin vermedi.' });
        }
    };

    const whatsappShareUrl = useMemo(() => `https://wa.me/?text=${encodeURIComponent(inviteMessage)}`, [inviteMessage]);

    const onPlatformCount = phoneContacts.filter(c => c.onPlatform).length;
    const pendingCount = phoneContacts.filter(c => !c.onPlatform).length;

    // ── iOS-stili küçük yardımcı bileşenler ────────────────────────────────
    const QuickAction = ({ icon: Icon, label, sub, onClick, asLabel, htmlFor }: { icon: React.ElementType; label: string; sub: string; onClick?: () => void; asLabel?: boolean; htmlFor?: string }) => {
        const inner = (
            <>
                <span className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Icon className="h-[22px] w-[22px] text-primary" strokeWidth={1.9} />
                </span>
                <span className="text-[13px] font-semibold text-foreground leading-tight text-center">{label}</span>
                <span className="text-[11px] text-muted-foreground leading-tight text-center">{sub}</span>
            </>
        );
        const cls = 'flex flex-col items-center justify-start gap-2 rounded-2xl bg-card border border-border/60 px-3 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] active:scale-[0.96] transition disabled:opacity-50';
        if (asLabel) {
            return <label htmlFor={htmlFor} className={cn(cls, 'cursor-pointer')}>{inner}</label>;
        }
        return <button type="button" onClick={onClick} disabled={phoneLoading} className={cls}>{inner}</button>;
    };

    const ContactRow = ({ contact }: { contact: PhoneContact }) => (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5">
            <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-10 w-10 ring-1 ring-border/50">
                    <AvatarImage src={contact.avatarUrl} />
                    <AvatarFallback className="bg-secondary text-foreground/60 text-sm font-semibold">{contact.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                    <p className="font-medium text-[15px] text-foreground break-words leading-tight">{contact.name}</p>
                    {contact.phones[0] ? <p className="text-[13px] text-muted-foreground truncate">{contact.phones[0]}</p> : null}
                </div>
            </div>
            {contact.onPlatform ? (
                <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[12px] font-semibold text-primary">
                    <Check className="h-3 w-3" /> hangel&apos;da
                </span>
            ) : (
                <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => handleInvitePhone(contact.name, contact.phones[0], 'whatsapp')} disabled={!contact.phones[0]}
                        className="h-9 w-9 rounded-full bg-[#25D366]/12 text-[#1c9b4b] flex items-center justify-center active:scale-90 transition disabled:opacity-40"
                        title="WhatsApp ile davet" aria-label={`${contact.name} WhatsApp daveti`}>
                        <MessageCircle className="h-[18px] w-[18px]" />
                    </button>
                    <button onClick={() => handleInvitePhone(contact.name, contact.phones[0], 'sms')} disabled={!contact.phones[0]}
                        className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center active:scale-90 transition disabled:opacity-40"
                        title="SMS ile davet" aria-label={`${contact.name} SMS daveti`}>
                        <MessageSquare className="h-[18px] w-[18px]" />
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-dvh bg-background">
            <div className="mx-auto w-full max-w-2xl px-4 sm:px-5 py-6 space-y-6 animate-in fade-in-0 duration-300">

                {/* HERO — squircle app-icon + büyük başlık */}
                <div className="text-center space-y-3 pt-2">
                    <span className="inline-flex h-[76px] w-[76px] items-center justify-center rounded-[24px] bg-gradient-to-br from-primary to-[#ff7a55] shadow-[0_10px_30px_-8px_rgba(243,71,35,0.5)]">
                        <HeroIcon className="h-9 w-9 text-white" strokeWidth={1.8} />
                    </span>
                    <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight text-foreground leading-[1.1]">{heroTitle}</h1>
                    <p className="text-[15px] text-muted-foreground max-w-md mx-auto leading-relaxed">{heroSubtitle}</p>
                </div>

                {/* DAVET LİNKİN */}
                <section className="space-y-2.5">
                    <h2 className="px-1 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Davet Linkin</h2>
                    <div className="rounded-3xl bg-card border border-border/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 space-y-4">
                        <div className="flex items-center gap-2 rounded-2xl bg-muted px-3.5 py-2.5">
                            <Input value={inviteLink} readOnly className="h-8 border-0 bg-transparent px-0 text-[14px] text-muted-foreground shadow-none focus-visible:ring-0" />
                            <button type="button" onClick={copyToClipboard} aria-label="Bağlantıyı kopyala"
                                className={cn('shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 h-8 text-[13px] font-semibold transition active:scale-95',
                                    copied ? 'bg-primary/10 text-primary' : 'bg-primary text-primary-foreground')}>
                                {copied ? <><Check className="h-4 w-4" /> Kopyalandı</> : <><Copy className="h-4 w-4" /> Kopyala</>}
                            </button>
                        </div>
                        <p className="text-[13px] leading-relaxed text-muted-foreground">{inviteMessage || 'Davet metni hazırlanıyor...'}</p>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 pt-1">
                            {shareOptions.map(option => (
                                <a key={option.name} href={option.href} target="_blank" rel="noopener noreferrer"
                                    className="flex flex-col items-center gap-1.5 group">
                                    <span className={cn('h-12 w-12 rounded-full flex items-center justify-center transition active:scale-90 group-hover:brightness-95', option.tint)}>
                                        <option.icon className="h-[20px] w-[20px]" />
                                    </span>
                                    <span className="text-[10px] text-muted-foreground truncate max-w-full">{option.name}</span>
                                </a>
                            ))}
                        </div>
                    </div>
                </section>

                {/* HIZLI DAVET YOLLARI */}
                <section className="space-y-2.5">
                    <h2 className="px-1 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Hızlı Davet Yolları</h2>
                    <input type="file" accept=".vcf,.csv,text/vcard,text/csv,text/plain" id="main-vcard-csv-upload" className="sr-only" onChange={handleFileImport} />
                    {/* Kişi İÇE AKTARMAYA izin veren platformlar — alt alta. Instagram/
                        LinkedIn kişi içe aktarmaya izin vermez (API kısıtı) → onlar yalnız
                        aşağıdaki "paylaş" bölümünde. */}
                    <div className="grid grid-cols-1 gap-2.5">
                        <QuickAction icon={Smartphone} label="Telefon Rehberi" sub="iOS / Android / Chrome" onClick={handlePhoneConnect} />
                        <QuickAction icon={Mail} label="Gmail Kişileri" sub="Google ile bağlan" onClick={() => handleEmailOAuth('google')} />
                        <QuickAction icon={Mail} label="Outlook / Hotmail Kişileri" sub="Microsoft ile bağlan" onClick={() => handleEmailOAuth('microsoft')} />
                        <QuickAction icon={Upload} label="vCard / CSV" sub="Tüm cihazlar (.vcf / .csv)" asLabel htmlFor="main-vcard-csv-upload" />
                        <QuickAction icon={MessageSquare} label="WhatsApp ile paylaş" sub="Davet linkini gönder" onClick={() => setWhatsappDialogOpen(true)} />
                    </div>
                    <p className="px-1 text-[12px] text-muted-foreground leading-snug">
                        iPhone / Safari&apos;de rehberi bağlamak için <span className="font-semibold text-foreground">hangel mobil uygulamasını</span> kullanın ya da rehberinizi vCard / CSV olarak yükleyin.
                    </p>
                </section>

                {/* KİŞİLERİ BUL — segmented control */}
                <section className="space-y-2.5">
                    <h2 className="px-1 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Kişilerini Bul</h2>
                    <div className="rounded-3xl bg-card border border-border/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4">
                        <Tabs defaultValue="phone" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 rounded-full bg-secondary p-1 h-11">
                                <TabsTrigger value="phone" className="rounded-full text-[13px] font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                                    <Contact className="mr-1.5 h-4 w-4" /> Rehber
                                </TabsTrigger>
                                <TabsTrigger value="email" className="rounded-full text-[13px] font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                                    <AtSign className="mr-1.5 h-4 w-4" /> Mail
                                </TabsTrigger>
                            </TabsList>

                            {/* Rehber */}
                            <TabsContent value="phone" className="mt-4">
                                {!phoneSynced ? (
                                    <div className="text-center space-y-4 py-4">
                                        <span className="inline-flex h-14 w-14 items-center justify-center rounded-[18px] bg-primary/10">
                                            <Contact className="h-7 w-7 text-primary" strokeWidth={1.8} />
                                        </span>
                                        <div className="space-y-1">
                                            <p className="font-semibold text-[15px] text-foreground">Rehberine Erişim Ver</p>
                                            <p className="text-[13px] text-muted-foreground max-w-sm mx-auto leading-relaxed">
                                                hangel, rehberini yalnızca kişilerini bulmak için kullanır. Hiçbir kişi bilgisi sunucularımızda saklanmaz.
                                            </p>
                                        </div>
                                        <Button onClick={handlePhoneSync} disabled={phoneLoading}
                                            className="w-full h-12 rounded-2xl text-[15px] font-semibold shadow-sm active:scale-[0.98] transition">
                                            {phoneLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Yükleniyor...</> : <><Contact className="mr-2 h-[18px] w-[18px]" /> Rehberimi Bağla</>}
                                        </Button>
                                        <div className="flex items-center gap-3 py-1">
                                            <div className="h-px flex-1 bg-border" />
                                            <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">veya</span>
                                            <div className="h-px flex-1 bg-border" />
                                        </div>
                                        <input type="file" accept=".vcf,.csv,text/vcard,text/csv" id="vcard-csv-upload" className="hidden" onChange={handleFileImport} />
                                        <Button asChild variant="secondary" disabled={phoneLoading}
                                            className="w-full h-11 rounded-2xl text-[14px] font-medium bg-secondary text-foreground hover:bg-secondary/80 active:scale-[0.98] transition">
                                            <label htmlFor="vcard-csv-upload" className="cursor-pointer"><Upload className="mr-2 h-4 w-4" /> vCard / CSV Yükle</label>
                                        </Button>
                                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                                            Masaüstünde rehbere doğrudan erişim mümkün değil. Telefonundan vCard (.vcf) ya da CSV olarak dışa aktarıp yükleyebilirsin.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-[13px] text-muted-foreground">
                                                <span className="font-semibold text-primary">{onPlatformCount}</span> hangel&apos;da · <span className="font-semibold text-foreground">{pendingCount}</span> davet bekliyor
                                            </p>
                                            <div className="flex items-center gap-1.5">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-secondary" aria-label="Sırala"><ArrowDownUp className="h-4 w-4" /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="rounded-2xl">
                                                        <DropdownMenuItem onClick={() => setSortCriteria('alphabetical')}>Alfabetik (A-Z)</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => setSortCriteria('platform')}>Platformda Olanlar Önce</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                <Button variant="ghost" size="sm" className="h-9 rounded-full px-3 text-[13px] text-primary font-semibold" onClick={() => { setPhoneSynced(false); setPhoneContacts([]); }}>Yenile</Button>
                                            </div>
                                        </div>
                                        {pendingCount > 0 && (
                                            <div className="flex gap-2">
                                                <Button size="sm" className="flex-1 h-11 rounded-2xl text-[14px] font-semibold active:scale-[0.98] transition"
                                                    onClick={() => handleBulkSms(phoneContacts.filter(c => !c.onPlatform).map(c => ({ name: c.name, phone: c.phones[0] })))}>
                                                    <MessageSquare className="mr-1.5 h-4 w-4" /> Tümüne SMS ({pendingCount})
                                                </Button>
                                                <Button size="sm" variant="secondary" onClick={handleBulkWhatsApp}
                                                    className="flex-1 h-11 rounded-2xl text-[14px] font-semibold bg-[#25D366]/12 text-[#1c9b4b] hover:bg-[#25D366]/20 active:scale-[0.98] transition">
                                                    <MessageCircle className="mr-1.5 h-4 w-4" /> Tümüne WhatsApp
                                                </Button>
                                            </div>
                                        )}
                                        <div className="rounded-2xl bg-muted/40 border border-border/50 divide-y divide-border/50 overflow-hidden max-h-[26rem] overflow-y-auto">
                                            {sortedPhoneContacts.length === 0 ? (
                                                <p className="text-center text-muted-foreground text-[13px] py-10">Rehberinde kişi bulunamadı.</p>
                                            ) : sortedPhoneContacts.map(c => (<ContactRow key={c.id} contact={c} />))}
                                        </div>
                                    </div>
                                )}
                            </TabsContent>

                            {/* Mail */}
                            <TabsContent value="email" className="mt-4">
                                <div className="space-y-4">
                                    <div className="text-center space-y-1.5 py-1">
                                        <span className="inline-flex h-12 w-12 items-center justify-center rounded-[16px] bg-primary/10">
                                            <AtSign className="h-6 w-6 text-primary" strokeWidth={1.8} />
                                        </span>
                                        <p className="font-semibold text-[15px] text-foreground">Mail Adresleriyle Davet</p>
                                        <p className="text-[13px] text-muted-foreground max-w-sm mx-auto leading-relaxed">
                                            Davet etmek istediğin adresleri ekle. Hazır olunca varsayılan mail uygulaman açılır; metin ve link otomatik dolar.
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Input type="email" placeholder="ornek@email.com" value={emailInput}
                                            className="h-11 rounded-2xl bg-muted border-border/60 text-[14px]"
                                            onChange={e => setEmailInput(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleEmailAdd(); } }} />
                                        <Button type="button" variant="secondary" onClick={handleEmailAdd} className="h-11 w-11 shrink-0 rounded-2xl bg-secondary active:scale-95 transition"><Plus className="h-5 w-5" /></Button>
                                    </div>
                                    {emailList.length > 0 && (
                                        <div className="flex flex-wrap gap-2 p-3 rounded-2xl bg-muted/50 border border-border/50">
                                            {emailList.map(email => (
                                                <span key={email} className="inline-flex max-w-full items-center gap-1 rounded-full bg-card border border-border/60 pl-3 pr-1.5 py-1 text-[13px] text-foreground shadow-sm">
                                                    <span className="min-w-0 break-all">{email}</span>
                                                    <button type="button" onClick={() => handleEmailRemove(email)} className="ml-0.5 rounded-full hover:bg-muted p-0.5" aria-label={`${email} adresini kaldır`}>
                                                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <Button onClick={handleEmailSend} disabled={emailSending || emailList.length === 0}
                                        className="w-full h-12 rounded-2xl text-[15px] font-semibold shadow-sm active:scale-[0.98] transition">
                                        {emailSending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gönderiliyor...</> : <><Send className="mr-2 h-[18px] w-[18px]" /> {emailList.length || ''} Adrese Davet Gönder</>}
                                    </Button>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </section>
            </div>

            {/* WhatsApp Davet Dialog */}
            <Dialog open={whatsappDialogOpen} onOpenChange={setWhatsappDialogOpen}>
                <DialogContent className="sm:max-w-md rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-[17px]"><MessageCircle className="h-5 w-5 text-[#1c9b4b]" /> WhatsApp ile Davet</DialogTitle>
                        <DialogDescription className="text-[13px]">Davet metnini kopyala veya doğrudan WhatsApp&apos;ta paylaş.</DialogDescription>
                    </DialogHeader>
                    <div className="rounded-2xl bg-muted p-3.5">
                        <p className="text-[13px] leading-relaxed text-foreground">{inviteMessage || 'Davet metni hazırlanıyor...'}</p>
                    </div>
                    <DialogFooter className="flex-row gap-2 sm:gap-2">
                        <Button type="button" variant="secondary" className="flex-1 h-11 rounded-2xl bg-secondary active:scale-[0.98] transition" onClick={handleCopyWhatsappMessage} disabled={!inviteMessage}>
                            <Copy className="mr-2 h-4 w-4" /> Kopyala
                        </Button>
                        <Button asChild className="flex-1 h-11 rounded-2xl bg-[#25D366] hover:bg-[#1fae57] text-white active:scale-[0.98] transition" disabled={!inviteMessage}>
                            <a href={whatsappShareUrl} target="_blank" rel="noopener noreferrer" onClick={() => setWhatsappDialogOpen(false)}>
                                <MessageCircle className="mr-2 h-4 w-4" /> Paylaş
                            </a>
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* E-posta Sağlayıcı Dialog */}
            <Dialog open={emailProviderDialogOpen} onOpenChange={setEmailProviderDialogOpen}>
                <DialogContent className="sm:max-w-md rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-[17px]"><Mail className="h-5 w-5 text-primary" /> E-posta Kişilerini İçe Aktar</DialogTitle>
                        <DialogDescription className="text-[13px]">Bir sağlayıcı seç. hangel kullananlar otomatik işaretlenir.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        {([
                            { p: 'google' as const, label: 'Gmail', sub: 'Google hesabıyla bağlan', dot: 'text-red-500' },
                            { p: 'microsoft' as const, label: 'Outlook / Hotmail', sub: 'Microsoft hesabıyla bağlan', dot: 'text-blue-500' },
                        ]).map(item => (
                            <button key={item.p} type="button" onClick={() => handleEmailOAuth(item.p)}
                                className="w-full flex items-center gap-3 rounded-2xl bg-muted/60 border border-border/50 px-3.5 h-14 text-left active:scale-[0.98] transition hover:bg-muted">
                                <Mail className={cn('h-5 w-5 shrink-0', item.dot)} />
                                <div className="flex flex-col min-w-0 flex-1">
                                    <span className="text-[14px] font-semibold text-foreground">{item.label}</span>
                                    <span className="text-[11px] text-muted-foreground">{item.sub}</span>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                            </button>
                        ))}
                        <button type="button" onClick={handleImapNote}
                            className="w-full flex items-center gap-3 rounded-2xl bg-muted/60 border border-border/50 px-3.5 h-14 text-left active:scale-[0.98] transition hover:bg-muted">
                            <AtSign className="h-5 w-5 shrink-0 text-muted-foreground" />
                            <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-[14px] font-semibold text-foreground">Kurumsal / Özel IMAP</span>
                                <span className="text-[11px] text-muted-foreground">İş veya okul mailini bağla</span>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        </button>

                        <div className="flex items-center gap-3 py-0.5">
                            <div className="h-px flex-1 bg-border" />
                            <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">veya</span>
                            <div className="h-px flex-1 bg-border" />
                        </div>

                        <input type="file" accept=".vcf,.csv,text/vcard,text/csv" id="email-vcard-csv-upload" className="hidden"
                            onChange={(e) => { setEmailProviderDialogOpen(false); handleFileImport(e); }} />
                        <label htmlFor="email-vcard-csv-upload"
                            className="w-full flex items-center gap-3 rounded-2xl bg-muted/60 border border-border/50 px-3.5 h-14 text-left active:scale-[0.98] transition hover:bg-muted cursor-pointer">
                            <Upload className="h-5 w-5 shrink-0 text-primary" />
                            <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-[14px] font-semibold text-foreground">vCard / CSV Yükle</span>
                                <span className="text-[11px] text-muted-foreground">Kişileri içe aktar, her birine davet gönder</span>
                            </div>
                        </label>

                        {emailList.length > 0 && (
                            <div className="rounded-2xl bg-muted/50 border border-border/50 p-2 space-y-1 max-h-40 overflow-y-auto">
                                {emailList.map((email) => (
                                    <div key={email} className="flex items-center justify-between text-[13px] px-2 py-1">
                                        <span className="truncate text-foreground">{email}</span>
                                        <a href={`mailto:${email}?subject=${encodeURIComponent(shareSubject)}&body=${encodeURIComponent(inviteMessage)}`}
                                            className="inline-flex items-center gap-1 text-primary hover:underline font-semibold" onClick={() => recordInvite(email, null, email)}>
                                            <Send className="h-3.5 w-3.5" /> Gönder
                                        </a>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <p className="text-[11px] text-muted-foreground text-center leading-relaxed pt-2 border-t border-border/60">
                        Kişiler yalnızca davet için kullanılır; sunucularımızda saklanmaz.
                    </p>
                </DialogContent>
            </Dialog>

            {/* İçe Aktarılan Kişiler Dialog */}
            <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                <DialogContent className="sm:max-w-md rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-[17px]"><Contact className="h-5 w-5 text-primary" /> İçe Aktarılan Kişiler</DialogTitle>
                        <DialogDescription className="text-[13px]">hangel kullananlar işaretlenir; kalanlara WhatsApp, SMS veya e-posta ile davet yolla.</DialogDescription>
                    </DialogHeader>
                    {importedContacts.some(c => !c.onPlatform && c.phones[0]) && (
                        <Button size="sm" className="w-full h-11 rounded-2xl text-[14px] font-semibold active:scale-[0.98] transition"
                            onClick={() => handleBulkSms(importedContacts.filter(c => !c.onPlatform && c.phones[0]).map(c => ({ name: c.name, phone: c.phones[0] })))}>
                            <MessageSquare className="mr-1.5 h-4 w-4" /> Telefonu olanların tümüne SMS ({importedContacts.filter(c => !c.onPlatform && c.phones[0]).length})
                        </Button>
                    )}
                    <div className="rounded-2xl bg-muted/40 border border-border/50 divide-y divide-border/50 overflow-hidden max-h-80 overflow-y-auto">
                        {importedContacts.length === 0 ? (
                            <p className="text-[13px] text-muted-foreground text-center py-8">Kişi bulunamadı.</p>
                        ) : importedContacts.map((c) => (
                            <div key={c.id} className="flex items-center justify-between gap-2 px-3 py-2.5">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <Avatar className="h-9 w-9 ring-1 ring-border/50"><AvatarFallback className="bg-secondary text-foreground/60 text-[13px] font-semibold">{c.name.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                                    <div className="min-w-0">
                                        <p className="text-[14px] font-medium text-foreground break-words leading-tight">{c.name}</p>
                                        <p className="text-[12px] text-muted-foreground truncate">{c.emails[0] || c.phones[0] || ''}</p>
                                    </div>
                                </div>
                                {c.onPlatform ? (
                                    <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[12px] font-semibold text-primary"><Check className="h-3 w-3" /> hangel&apos;da</span>
                                ) : (
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        {c.phones[0] && (
                                            <>
                                                <button onClick={() => sendInviteToImported(c, 'whatsapp')} title="WhatsApp ile davet" aria-label={`${c.name} WhatsApp daveti`}
                                                    className="h-9 w-9 rounded-full bg-[#25D366]/12 text-[#1c9b4b] flex items-center justify-center active:scale-90 transition"><MessageCircle className="h-[18px] w-[18px]" /></button>
                                                <button onClick={() => sendInviteToImported(c, 'sms')} title="SMS ile davet" aria-label={`${c.name} SMS daveti`}
                                                    className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center active:scale-90 transition"><MessageSquare className="h-[18px] w-[18px]" /></button>
                                            </>
                                        )}
                                        {c.emails[0] && (
                                            <button onClick={() => sendInviteToImported(c, 'email')} title="E-posta ile davet" aria-label={`${c.name} e-posta daveti`}
                                                className="h-9 w-9 rounded-full bg-secondary text-foreground/70 flex items-center justify-center active:scale-90 transition"><Mail className="h-[18px] w-[18px]" /></button>
                                        )}
                                        {!c.phones[0] && !c.emails[0] && (<span className="text-[11px] text-muted-foreground">İletişim yok</span>)}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
