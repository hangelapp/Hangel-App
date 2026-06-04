'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { isNativeApp } from '@/lib/capacitor';

const INVITE_POINTS = 10;
import { Input } from '@/components/ui/input';
import {
    Mail,
    Send,
    MessageSquare,
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
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { COLLECTIONS } from '@/firebase/collections';

interface PhoneContact {
    id: string;
    name: string;
    phones: string[];
    avatarUrl?: string;
    onPlatform?: boolean;
    impactScore?: number;
    joinDate?: string;
}

// İçe aktarılan kişi (telefon + e-posta) — OAuth / Contact Picker / dosya sonrası
// toplu davet dialog'unda gösterilir (ngo-admin/qr import dialog'unu yansıtır).
interface ImportedContact {
    id: string;
    name: string;
    phones: string[];
    emails: string[];
    onPlatform?: boolean;
}

const buildInviteText = (link: string) =>
    `Bugün hiçbir ekstra ödeme yapmadan bağış yaptım. Aynısını sen de yapabilirsin. Gel birlikte büyütelim: ${link}`;

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

    // İzni iste — kullanıcı reddederse net hata fırlat
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
        projection: {
            name: true,
            phones: true,
            image: false,
        },
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

// vCard (.vcf) basit parse — FN/N, TEL satırları
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
            contacts.push({
                id: `vcf-${contacts.length}-${name}`,
                name: name || 'İsimsiz',
                phones,
                onPlatform: false,
            });
        }
    }
    return contacts;
}

// CSV: ilk satır header (name,phone veya isim,telefon vb.) — esnek
function parseCSV(text: string): PhoneContact[] {
    const rows = text.split(/\r?\n/).map(r => r.trim()).filter(Boolean);
    if (rows.length === 0) return [];
    const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
    const nameIdx = headers.findIndex(h => /(name|isim|ad)/i.test(h));
    const phoneIdx = headers.findIndex(h => /(phone|tel|telefon|gsm|mobile|cep)/i.test(h));
    if (nameIdx === -1 && phoneIdx === -1) {
        // Header yoksa: ilk sütun isim, ikinci telefon varsay
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

export default function InvitePage() {
    const { toast } = useToast();
    const { user: authUser } = useUser();
    const db = useFirestore();
    const [inviteLink, setInviteLink] = useState('');
    const [sortCriteria, setSortCriteria] = useState('alphabetical');

    // Telefon rehberi state
    const [phoneContacts, setPhoneContacts] = useState<PhoneContact[]>([]);
    const [phoneLoading, setPhoneLoading] = useState(false);
    const [phoneSynced, setPhoneSynced] = useState(false);

    // Mail davet state
    const [emailInput, setEmailInput] = useState('');
    const [emailList, setEmailList] = useState<string[]>([]);
    const [emailSending, setEmailSending] = useState(false);

    // Dialog state — WhatsApp / E-posta sağlayıcı / İçe aktarılan kişiler
    const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false);
    const [emailProviderDialogOpen, setEmailProviderDialogOpen] = useState(false);
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [importedContacts, setImportedContacts] = useState<ImportedContact[]>([]);

    // Platformdaki telefon eşleşmesi için (sadece "hangel'da" rozetini göstermek amacıyla)
    const usersRef = useMemoFirebase(() => collection(db, COLLECTIONS.users), [db]);
    const { data: allUsers } = useCollection(usersRef);

    useEffect(() => {
        if (typeof window !== 'undefined' && authUser?.uid) {
            // Hedef sayfa: kayıt akışını başlatan login/selection
            setInviteLink(`${window.location.origin}/login/selection?ref=${authUser.uid}`);
        }
    }, [authUser?.uid]);

    const inviteMessage = useMemo(() => buildInviteText(inviteLink), [inviteLink]);

    const copyToClipboard = () => {
        if (!inviteLink) return;
        navigator.clipboard.writeText(inviteLink);
        toast({ title: 'Davet linki kopyalandı!' });
    };

    const recordInvite = async (recipientName: string, recipientPhone?: string | null, recipientEmail?: string | null) => {
        if (!authUser?.uid) return 0;
        try {
            await addDoc(collection(db, COLLECTIONS.invites), {
                senderId: authUser.uid,
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

    const handleInvitePhone = async (name: string, phone?: string) => {
        if (phone && inviteLink) {
            const msg = encodeURIComponent(inviteMessage);
            const nav = typeof navigator !== 'undefined' ? navigator : null;
            const ua = nav?.userAgent ?? '';
            const isMobileUA = /(Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini)/i.test(ua);
            const hasTouch = (nav?.maxTouchPoints ?? 0) > 0;
            const isDesktop = !isNativeApp() && !isMobileUA && !hasTouch;
            if (isDesktop) {
                const digits = (phone || '').replace(/\D/g, '');
                const waUrl = digits
                    ? `https://wa.me/${digits}?text=${msg}`
                    : `https://wa.me/?text=${msg}`;
                window.open(waUrl, '_blank', 'noopener,noreferrer');
            } else {
                window.open(`sms:${phone}?&body=${msg}`, '_blank');
            }
        }
        const awarded = await recordInvite(name, phone, null);
        toast({
            title: 'Davet Gönderildi!',
            description: awarded
                ? `${name} kişisine davet gönderildi. +${awarded} Etki Puanı kazandınız.`
                : `${name} kişisine hangel davetiniz gönderildi.`,
        });
    };

    // İçe aktarılan kişiye davet gönder — e-posta varsa mailto, yoksa SMS (ngo-admin/qr ile aynı).
    const sendInviteToImported = async (c: ImportedContact) => {
        const email = c.emails[0];
        const phone = c.phones[0];
        if (email) {
            window.open(`mailto:${email}?subject=${encodeURIComponent('hangel daveti')}&body=${encodeURIComponent(inviteMessage)}`, '_blank');
            const awarded = await recordInvite(c.name, null, email);
            toast({
                title: 'Davet Gönderildi!',
                description: awarded
                    ? `${c.name} kişisine davet açıldı. +${awarded} Etki Puanı kazandınız.`
                    : `${c.name} kişisine hangel davetiniz açıldı.`,
            });
            return;
        }
        if (phone) {
            await handleInvitePhone(c.name, phone);
            return;
        }
        toast({ variant: 'destructive', title: 'İletişim bilgisi yok', description: `${c.name} için e-posta veya telefon bulunamadı.` });
    };

    const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

    const handleEmailAdd = () => {
        const value = emailInput.trim();
        if (!value) return;
        // virgül/boşluk ile ayrılmış birden çok adresi destekle
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
            const subject = encodeURIComponent('hangel daveti');
            const body = encodeURIComponent(inviteMessage);
            if (emailList.length === 1) {
                window.open(`mailto:${encodeURIComponent(emailList[0])}?subject=${subject}&body=${body}`, '_blank');
            } else {
                const bcc = encodeURIComponent(emailList.join(','));
                window.open(`mailto:?bcc=${bcc}&subject=${subject}&body=${body}`, '_blank');
            }

            let total = 0;
            for (const email of emailList) {
                const awarded = await recordInvite(email, null, email);
                total += awarded;
            }
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
                    toast({
                        variant: 'destructive',
                        title: 'Rehbere erişilemedi',
                        description: 'İzin verilmedi veya bir hata oluştu.',
                    });
                    return;
                }
            }

            if (contacts.length === 0) {
                toast({
                    variant: 'destructive',
                    title: 'Kişi bulunamadı',
                    description: 'Rehberinizde kişi yok veya hiçbiri seçilmedi.',
                });
                return;
            }

            const firestorePhones = new Set(
                (allUsers || []).flatMap((u: { phoneNumber?: string; personalInfo?: { phone?: string } }) => [u.phoneNumber, u.personalInfo?.phone].filter(Boolean))
            );
            const normalize = (p: string) => p.replace(/[\s()-]/g, '');

            const enriched = contacts.map(c => ({
                ...c,
                onPlatform: c.phones.some(p => firestorePhones.has(normalize(p))),
            }));

            setPhoneContacts(enriched);
            setPhoneSynced(true);
            // Toplu davet dialog'unda da göster (ngo-admin/qr ile aynı davranış).
            setImportedContacts(enriched.map(c => ({
                id: c.id,
                name: c.name,
                phones: c.phones,
                emails: [],
                onPlatform: c.onPlatform,
            })));
            setImportDialogOpen(true);
            toast({
                title: 'Rehber Senkronize Edildi',
                description: `${enriched.length} kişi yüklendi.`,
            });
        } finally {
            setPhoneLoading(false);
        }
    };

    // vCard veya CSV dosya import (desktop fallback)
    const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = ''; // reset

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

            const firestorePhones = new Set(
                (allUsers || []).flatMap((u: { phoneNumber?: string; personalInfo?: { phone?: string } }) => [u.phoneNumber, u.personalInfo?.phone].filter(Boolean))
            );
            const normalize = (p: string) => p.replace(/[\s()-]/g, '');
            const enriched = parsed.map(c => ({
                ...c,
                onPlatform: c.phones.some(p => firestorePhones.has(normalize(p))),
            }));
            setPhoneContacts(enriched);
            setPhoneSynced(true);
            setImportedContacts(enriched.map(c => ({
                id: c.id,
                name: c.name,
                phones: c.phones,
                emails: [],
                onPlatform: c.onPlatform,
            })));
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
        { name: 'WhatsApp', icon: MessageSquare, href: `https://wa.me/?text=${encodeURIComponent(inviteMessage)}` },
        { name: 'SMS', icon: Smartphone, href: `sms:?&body=${encodeURIComponent(inviteMessage)}` },
        { name: 'Telegram', icon: Send, href: `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(inviteMessage)}` },
        { name: 'E-posta', icon: Mail, href: `mailto:?subject=${encodeURIComponent('hangel daveti')}&body=${encodeURIComponent(inviteMessage)}` },
        { name: 'X (Twitter)', icon: Twitter, href: `https://x.com/intent/tweet?text=${encodeURIComponent(inviteMessage)}` },
        { name: 'LinkedIn', icon: Linkedin, href: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(inviteLink)}&title=${encodeURIComponent(inviteMessage)}` },
    ];

    const sortedPhoneContacts = useMemo(() => {
        const byName = (a: PhoneContact, b: PhoneContact) => a.name.localeCompare(b.name, 'tr');
        const onPlatform = phoneContacts.filter(c => c.onPlatform).sort(byName);
        const offPlatform = phoneContacts.filter(c => !c.onPlatform).sort(byName);
        const sorted = [...onPlatform, ...offPlatform];
        if (sortCriteria === 'alphabetical') sorted.sort(byName);
        return sorted;
    }, [phoneContacts, sortCriteria]);

    // Telefon Rehberini Bağla — Web Contacts API; desteklenmeyen tarayıcıda
    // toast + vCard/CSV upload dialog'ını otomatik aç (fallback UX).
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
            // vCard/CSV dosya seçiciyi doğrudan tetikle (e-posta dialog'u açmak yerine).
            if (typeof document !== 'undefined') {
                (document.getElementById('main-vcard-csv-upload') as HTMLInputElement | null)?.click();
            }
            return;
        }
        await handlePhoneSync();
    };

    // E-posta sağlayıcı OAuth (Gmail → google People API, Outlook → Microsoft Graph).
    // Sunucu tarafı one-shot okuma: popup açar, dönüşte postMessage ile kişiler gelir.
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
                    toast({
                        title: 'Outlook kişilerini dışa aktar',
                        description: 'outlook.live.com → People → Manage → Export',
                    });
                }
                if (typeof document !== 'undefined') {
                    (document.getElementById('email-vcard-csv-upload') as HTMLInputElement | null)?.click();
                }
                return;
            }
            toast({
                variant: 'destructive',
                title: 'Bağlanılamadı',
                description: data?.message ?? 'E-posta kişileri içe aktarılamadı. Lütfen tekrar deneyin.',
            });
        } catch {
            toast({
                variant: 'destructive',
                title: 'Bağlanılamadı',
                description: 'E-posta kişileri içe aktarılamadı. Lütfen tekrar deneyin.',
            });
        }
    };

    // IMAP üzerinden kişi çekmek için bir API yok — dürüst yönlendirme (vCard/CSV).
    const handleImapNote = () => {
        toast({
            title: 'IMAP ile kişi içe aktarma yok',
            description: 'Kurumsal/özel maillerde kişileri vCard (.vcf) veya CSV olarak dışa aktarıp aşağıdan yükleyin.',
        });
        if (typeof document !== 'undefined') {
            (document.getElementById('email-vcard-csv-upload') as HTMLInputElement | null)?.click();
        }
    };

    // OAuth popup'tan dönen kişileri mevcut davet listelerine besle.
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

            const firestorePhones = new Set(
                (allUsers || []).flatMap((u: { phoneNumber?: string; personalInfo?: { phone?: string } }) => [u.phoneNumber, u.personalInfo?.phone].filter(Boolean))
            );
            const normalize = (p: string) => p.replace(/[\s()-]/g, '');

            const phoneEntries: PhoneContact[] = [];
            const emailEntries: string[] = [];
            const imported: ImportedContact[] = [];
            data.contacts.forEach((c, i) => {
                const name = (c.name || '').trim() || 'İsimsiz';
                const phone = (c.phone || '').trim();
                const email = (c.email || '').trim();
                const validEmail = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
                const onPlatform = phone ? firestorePhones.has(normalize(phone)) : false;
                if (phone) {
                    phoneEntries.push({ id: `oauth-${i}-${name}`, name, phones: [phone], onPlatform });
                }
                if (validEmail) {
                    emailEntries.push(validEmail);
                }
                if (phone || validEmail) {
                    imported.push({
                        id: `oauth-${i}-${name}`,
                        name,
                        phones: phone ? [phone] : [],
                        emails: validEmail ? [validEmail] : [],
                        onPlatform,
                    });
                }
            });

            // Mevcut senkronize rehberi koru — üzerine yazma, birleştir.
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

            const total = imported.length;
            if (total > 0) {
                // Kişiler hemen görünür ve davet edilebilir olsun diye toplu davet dialog'unu aç.
                setImportedContacts(imported);
                setEmailProviderDialogOpen(false);
                setImportDialogOpen(true);
                toast({ title: 'Kişiler içe aktarıldı', description: `${total} kişi davet listene eklendi.` });
            } else {
                toast({ title: 'Kişi bulunamadı', description: 'İçe aktarılacak telefon veya e-posta bulunamadı.' });
            }
        };
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, [allUsers, toast]);

    // WhatsApp davet metnini kopyala
    const handleCopyWhatsappMessage = async () => {
        if (!inviteMessage) return;
        try {
            await navigator.clipboard.writeText(inviteMessage);
            toast({ title: 'Mesaj kopyalandı!', description: "Şimdi WhatsApp'ta yapıştırıp gönderebilirsin." });
        } catch {
            toast({ variant: 'destructive', title: 'Kopyalanamadı', description: 'Tarayıcı izin vermedi.' });
        }
    };

    const whatsappShareUrl = useMemo(
        () => `https://wa.me/?text=${encodeURIComponent(inviteMessage)}`,
        [inviteMessage]
    );

    const ContactCard = ({ contact }: { contact: PhoneContact }) => (
        <div className="flex items-center justify-between p-3 rounded-lg border bg-background">
            <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                    <AvatarImage src={contact.avatarUrl} />
                    <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-medium text-sm">{contact.name}</p>
                    {contact.phones[0] ? (
                        <p className="text-xs text-muted-foreground">{contact.phones[0]}</p>
                    ) : null}
                </div>
            </div>
            {contact.onPlatform ? (
                <Badge variant="secondary" className="font-normal">hangel'da</Badge>
            ) : (
                <Button size="sm" onClick={() => handleInvitePhone(contact.name, contact.phones[0])}>
                    Davet Et
                </Button>
            )}
        </div>
    );

    return (
        <div className="p-4 sm:p-6 space-y-8 animate-in fade-in-0">
            <div className="text-center space-y-2">
                <div className="inline-block bg-primary/10 p-4 rounded-full">
                    <Gift className="h-10 w-10 text-primary" />
                </div>
                <h1 className="text-3xl font-bold font-headline">İyiliği Paylaş, Birlikte Büyüyelim</h1>
                <p className="text-muted-foreground max-w-md mx-auto">
                    Arkadaşlarını hangel'a davet et, hem sen hem de onlar kazansın.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Davet Linkin</CardTitle>
                    <CardDescription>Kişisel linkini kopyalayarak veya aşağıdaki butonlarla paylaş.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="relative flex w-full items-center">
                        <Input
                            value={inviteLink}
                            readOnly
                            className="h-12 pr-12 text-sm text-muted-foreground bg-muted border-dashed"
                        />
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={copyToClipboard}
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9"
                            aria-label="Bağlantıyı kopyala"
                        >
                            <Copy className="h-5 w-5" />
                        </Button>
                    </div>
                    <div className="rounded-lg border bg-muted/30 p-3">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Davet metni</p>
                        <p className="text-sm leading-relaxed">{inviteMessage || 'Davet metni hazırlanıyor...'}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {shareOptions.map(option => (
                            <Button key={option.name} asChild variant="outline" className="h-12">
                                <a href={option.href} target="_blank" rel="noopener noreferrer">
                                    <option.icon className="mr-2 h-5 w-5" /> {option.name}
                                </a>
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Hızlı Davet Yolları</CardTitle>
                    <CardDescription>Telefon rehberin, kişi dosyan, e-posta veya WhatsApp üzerinden arkadaşlarını davet et.</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Why: iOS Safari'de `display: none` (hidden class) bazen file
                        picker'ı tetiklemez. sr-only (absolute, 1px size) DOM'da kalır
                        ama görünmez — label htmlFor click'i güvenle iletir. */}
                    <input
                        type="file"
                        accept=".vcf,.csv,text/vcard,text/csv,text/plain"
                        id="main-vcard-csv-upload"
                        className="sr-only"
                        onChange={handleFileImport}
                    />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <Button
                            variant="outline"
                            className="h-auto py-4 flex flex-col items-center gap-2"
                            onClick={handlePhoneConnect}
                            disabled={phoneLoading}
                        >
                            <Smartphone className="h-6 w-6 text-primary" />
                            <span className="text-xs font-semibold">Telefon Rehberi</span>
                            <span className="text-[10px] text-muted-foreground leading-tight">Mobil / Chrome Android</span>
                        </Button>

                        <label
                            htmlFor="main-vcard-csv-upload"
                            className="h-auto py-4 flex flex-col items-center gap-2 cursor-pointer rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
                            aria-disabled={phoneLoading || undefined}
                        >
                            <Upload className="h-6 w-6 text-primary" />
                            <span className="text-xs font-semibold">vCard / CSV Yükle</span>
                            <span className="text-[10px] text-muted-foreground leading-tight">Tüm cihazlarda çalışır</span>
                        </label>

                        <Button
                            variant="outline"
                            className="h-auto py-4 flex flex-col items-center gap-2"
                            onClick={() => setEmailProviderDialogOpen(true)}
                        >
                            <Mail className="h-6 w-6 text-primary" />
                            <span className="text-xs font-semibold">E-posta Kişileri</span>
                            <span className="text-[10px] text-muted-foreground leading-tight">Gmail / Outlook</span>
                        </Button>

                        <Button
                            variant="outline"
                            className="h-auto py-4 flex flex-col items-center gap-2"
                            onClick={() => setWhatsappDialogOpen(true)}
                        >
                            <MessageSquare className="h-6 w-6 text-primary" />
                            <span className="text-xs font-semibold">WhatsApp Davet</span>
                            <span className="text-[10px] text-muted-foreground leading-tight">Kopyala veya paylaş</span>
                        </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-3 leading-snug">
                        💡 <strong>iPhone / Safari kullanıcıları:</strong> Telefon Rehberini bağlamak için
                        hangel mobil uygulamasını kullanın. Veya rehberinizi dışa aktarıp
                        <strong className="text-foreground"> vCard / CSV </strong>
                        ile yükleyin.
                    </p>
                </CardContent>
            </Card>

            {/* WhatsApp Davet Dialog */}
            <Dialog open={whatsappDialogOpen} onOpenChange={setWhatsappDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-primary" /> WhatsApp ile Davet
                        </DialogTitle>
                        <DialogDescription>
                            Davet metnini kopyala veya doğrudan WhatsApp&apos;ta paylaş.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="rounded-lg border bg-muted/30 p-3">
                            <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Davet metni</p>
                            <p className="text-sm leading-relaxed">{inviteMessage || 'Davet metni hazırlanıyor...'}</p>
                        </div>
                    </div>
                    <DialogFooter className="flex-row gap-2 sm:gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={handleCopyWhatsappMessage}
                            disabled={!inviteMessage}
                        >
                            <Copy className="mr-2 h-4 w-4" /> Mesajı Kopyala
                        </Button>
                        <Button asChild className="flex-1" disabled={!inviteMessage}>
                            <a
                                href={whatsappShareUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setWhatsappDialogOpen(false)}
                            >
                                <MessageSquare className="mr-2 h-4 w-4" /> WhatsApp&apos;ta Paylaş
                            </a>
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* E-posta Sağlayıcı Dialog */}
            <Dialog open={emailProviderDialogOpen} onOpenChange={setEmailProviderDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Mail className="h-5 w-5 text-primary" /> E-posta Kişilerini İçe Aktar
                        </DialogTitle>
                        <DialogDescription>
                            Mail kişilerini içe aktarmak için bir sağlayıcı seç. hangel kullanan arkadaşların otomatik işaretlenir.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-start h-12"
                            onClick={() => handleEmailOAuth('google')}
                        >
                            <Mail className="mr-3 h-5 w-5 text-red-500" />
                            <div className="flex flex-col items-start">
                                <span className="text-sm font-semibold">Gmail</span>
                                <span className="text-[10px] text-muted-foreground">Google hesabıyla bağlan</span>
                            </div>
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-start h-12"
                            onClick={() => handleEmailOAuth('microsoft')}
                        >
                            <Mail className="mr-3 h-5 w-5 text-blue-500" />
                            <div className="flex flex-col items-start">
                                <span className="text-sm font-semibold">Outlook / Hotmail</span>
                                <span className="text-[10px] text-muted-foreground">Microsoft hesabıyla bağlan</span>
                            </div>
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-start h-12"
                            onClick={handleImapNote}
                        >
                            <AtSign className="mr-3 h-5 w-5 text-muted-foreground" />
                            <div className="flex flex-col items-start">
                                <span className="text-sm font-semibold">Kurumsal / Özel IMAP</span>
                                <span className="text-[10px] text-muted-foreground">İş veya okul mailini bağla</span>
                            </div>
                        </Button>

                        <div className="flex items-center gap-2 my-1">
                            <div className="h-px flex-1 bg-border" />
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">veya</span>
                            <div className="h-px flex-1 bg-border" />
                        </div>

                        <input
                            type="file"
                            accept=".vcf,.csv,text/vcard,text/csv"
                            id="email-vcard-csv-upload"
                            className="hidden"
                            onChange={(e) => { setEmailProviderDialogOpen(false); handleFileImport(e); }}
                        />
                        <Button
                            asChild
                            type="button"
                            variant="outline"
                            className="w-full justify-start h-12"
                            disabled={phoneLoading}
                        >
                            <label htmlFor="email-vcard-csv-upload" className="cursor-pointer flex items-center w-full">
                                <Upload className="mr-3 h-5 w-5 text-primary" />
                                <div className="flex flex-col items-start">
                                    <span className="text-sm font-semibold">vCard / CSV Yükle</span>
                                    <span className="text-[10px] text-muted-foreground">Kişileri içe aktar, her birine davet gönder</span>
                                </div>
                            </label>
                        </Button>

                        {emailList.length > 0 && (
                            <div className="rounded-lg border bg-muted/30 p-2 space-y-1 max-h-40 overflow-y-auto">
                                {emailList.map((email) => (
                                    <div key={email} className="flex items-center justify-between text-xs px-2 py-1">
                                        <span className="truncate">{email}</span>
                                        <a
                                            href={`mailto:${email}?subject=${encodeURIComponent('hangel daveti')}&body=${encodeURIComponent(inviteMessage)}`}
                                            className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
                                            onClick={() => recordInvite(email, null, email)}
                                        >
                                            <Send className="h-3 w-3" /> Davet Gönder
                                        </a>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center leading-relaxed pt-2 border-t">
                        Gmail veya Outlook ile bağlanıp kişilerini içe aktar. Kişiler yalnızca davet için kullanılır; sunucularımızda saklanmaz. Kurumsal/özel mail için vCard/CSV yükle.
                    </p>
                </DialogContent>
            </Dialog>

            {/* İçe Aktarılan Kişiler Dialog — OAuth / Contact Picker / dosya sonrası toplu davet */}
            <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Contact className="h-5 w-5 text-primary" /> İçe Aktarılan Kişiler
                        </DialogTitle>
                        <DialogDescription>
                            İçe aktarılan kişilere davet linkini gönder. hangel kullanan arkadaşların işaretlenir.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-80 overflow-y-auto space-y-2">
                        {importedContacts.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-6">Kişi bulunamadı.</p>
                        ) : importedContacts.map((c) => (
                            <div key={c.id} className="flex items-center justify-between p-2 rounded-lg border bg-background">
                                <div className="flex items-center gap-2 min-w-0">
                                    <Avatar className="h-8 w-8"><AvatarFallback>{c.name.charAt(0)}</AvatarFallback></Avatar>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">{c.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{c.emails[0] || c.phones[0] || ''}</p>
                                    </div>
                                </div>
                                {c.onPlatform ? (
                                    <Badge variant="secondary" className="font-normal flex-shrink-0">hangel&apos;da</Badge>
                                ) : (
                                    <Button
                                        size="sm"
                                        onClick={() => sendInviteToImported(c)}
                                        disabled={!c.emails[0] && !c.phones[0]}
                                        className="flex-shrink-0"
                                    >
                                        <Send className="mr-1 h-3 w-3" /> Davet Gönder
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            <Card>
                <CardHeader>
                    <CardTitle>Arkadaşlarını Bul</CardTitle>
                    <CardDescription>Rehberini ya da mail adresini bağlayarak arkadaşlarına hızlıca davet gönder.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="phone" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="phone">
                                <Contact className="mr-2 h-4 w-4" /> Rehberini Bağla
                            </TabsTrigger>
                            <TabsTrigger value="email">
                                <AtSign className="mr-2 h-4 w-4" /> Mail Adresini Bağla
                            </TabsTrigger>
                        </TabsList>

                        {/* Rehberini Bağla */}
                        <TabsContent value="phone" className="mt-4">
                            {!phoneSynced ? (
                                <div className="text-center space-y-4 py-6">
                                    <div className="inline-block bg-primary/10 p-4 rounded-full">
                                        <Contact className="h-8 w-8 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">Rehberine Erişim Ver</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            hangel, rehberini yalnızca arkadaşlarını bulmak için kullanır.
                                            Hiçbir kişi bilgisi sunucularımızda saklanmaz.
                                        </p>
                                    </div>
                                    <Button onClick={handlePhoneSync} disabled={phoneLoading} className="w-full">
                                        {phoneLoading
                                            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Yükleniyor...</>
                                            : <><Contact className="mr-2 h-4 w-4" /> Rehberimi Bağla</>
                                        }
                                    </Button>
                                    <div className="flex items-center gap-2 my-2">
                                        <div className="h-px flex-1 bg-border" />
                                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">veya</span>
                                        <div className="h-px flex-1 bg-border" />
                                    </div>
                                    <div className="space-y-2">
                                        <input
                                            type="file"
                                            accept=".vcf,.csv,text/vcard,text/csv"
                                            id="vcard-csv-upload"
                                            className="hidden"
                                            onChange={handleFileImport}
                                        />
                                        <Button asChild variant="outline" disabled={phoneLoading} className="w-full">
                                            <label htmlFor="vcard-csv-upload" className="cursor-pointer">
                                                <Upload className="mr-2 h-4 w-4" /> vCard/CSV Yükle
                                            </label>
                                        </Button>
                                        <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
                                            Masaüstünde rehbere doğrudan erişim mümkün değil. Telefonundan vCard (.vcf) ya da CSV olarak dışa aktarıp yükleyebilirsin.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm text-muted-foreground">
                                            {phoneContacts.filter(c => c.onPlatform).length} kişi hangel'da •{' '}
                                            {phoneContacts.filter(c => !c.onPlatform).length} kişi davet bekliyor
                                        </p>
                                        <div className="flex gap-2">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="outline" size="icon" className="h-9 w-9" aria-label="Sırala">
                                                        <ArrowDownUp className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => setSortCriteria('alphabetical')}>Alfabetik (A-Z)</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setSortCriteria('platform')}>Platformda Olanlar Önce</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            <Button variant="ghost" size="sm" onClick={() => { setPhoneSynced(false); setPhoneContacts([]); }}>
                                                Yenile
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-3 max-h-80 overflow-y-auto">
                                        {sortedPhoneContacts.length === 0 ? (
                                            <p className="text-center text-muted-foreground text-sm py-8">Rehberinde kişi bulunamadı.</p>
                                        ) : sortedPhoneContacts.map(c => (
                                            <ContactCard key={c.id} contact={c} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </TabsContent>

                        {/* Mail Adresini Bağla */}
                        <TabsContent value="email" className="mt-4">
                            <div className="space-y-4">
                                <div className="text-center space-y-2 py-2">
                                    <div className="inline-block bg-primary/10 p-3 rounded-full">
                                        <AtSign className="h-6 w-6 text-primary" />
                                    </div>
                                    <p className="font-semibold text-sm">Mail Adresleriyle Davet</p>
                                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                                        Davet etmek istediğin mail adreslerini ekle. Hazırlandığında varsayılan mail uygulaman açılır;
                                        davet metni ve linkin otomatik doldurulur.
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Input
                                        type="email"
                                        placeholder="ornek@email.com"
                                        value={emailInput}
                                        onChange={e => setEmailInput(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') { e.preventDefault(); handleEmailAdd(); }
                                        }}
                                    />
                                    <Button type="button" variant="outline" onClick={handleEmailAdd}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                                {emailList.length > 0 && (
                                    <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/30">
                                        {emailList.map(email => (
                                            <Badge key={email} variant="secondary" className="font-normal pl-3 pr-1 py-1 gap-1">
                                                {email}
                                                <button
                                                    type="button"
                                                    onClick={() => handleEmailRemove(email)}
                                                    className="ml-1 rounded-full hover:bg-muted p-0.5"
                                                    aria-label={`${email} adresini kaldır`}
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                                <Button
                                    onClick={handleEmailSend}
                                    disabled={emailSending || emailList.length === 0}
                                    className="w-full"
                                >
                                    {emailSending
                                        ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gönderiliyor...</>
                                        : <><Send className="mr-2 h-4 w-4" /> {emailList.length} Adrese Davet Gönder</>
                                    }
                                </Button>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

        </div>
    );
}
