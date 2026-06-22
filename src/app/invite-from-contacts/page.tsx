'use client';

/**
 * /invite-from-contacts — Rehberden Hangel kullanıcılarını bul, davet et.
 *
 * iOS native: @capacitor-community/contacts plugin → tüm telefon numaraları
 * Privacy: SHA-256 hash'lenip /api/contacts/sync'e gönderilir
 * Eşleşenler → Hangel kullanıcısı (takip ekle)
 * Eşleşmeyenler → SMS/WhatsApp invite link (web fallback)
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Loader2, UserPlus, Search, Smartphone, ArrowRight } from 'lucide-react';

import { useUser } from '@/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Capacitor } from '@capacitor/core';
import { getDeviceContacts, hashPhoneForMatch, type ContactSummary } from '@/lib/native-contacts';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/components/providers/language-provider';

interface MatchedContact {
  contact: ContactSummary;
  hangelUser?: { userId: string; name?: string; avatarUrl?: string };
}

export default function InviteFromContactsPage() {
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<MatchedContact[]>([]);
  const [search, setSearch] = useState('');
  const [scanned, setScanned] = useState(false);
  // Native platform tespiti (web'de rehber taraması mümkün değil).
  // Capacitor.isNativePlatform yalnızca client'ta güvenilir → effect ile set.
  const [isNative, setIsNative] = useState(false);
  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  const scan = async () => {
    if (!user) return;
    if (!Capacitor.isNativePlatform()) {
      toast({ variant: 'destructive', title: t('inviteContactsPage.nativeRequiredTitle'), description: t('inviteContactsPage.nativeRequiredDesc') });
      return;
    }
    setLoading(true);
    try {
      const deviceContacts = await getDeviceContacts();
      if (deviceContacts.length === 0) {
        toast({ variant: 'destructive', title: t('inviteContactsPage.emptyContactsTitle'), description: t('inviteContactsPage.emptyContactsDesc') });
        setLoading(false);
        return;
      }
      // Tüm benzersiz hash'leri hesapla
      const phoneToHash = new Map<string, string>();
      for (const c of deviceContacts) {
        for (const p of c.phones) {
          if (!phoneToHash.has(p)) {
            phoneToHash.set(p, await hashPhoneForMatch(p));
          }
        }
      }
      const allHashes = Array.from(phoneToHash.values());
      // Backend match
      const idToken = await user.getIdToken();
      const res = await fetch('/api/contacts/sync', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ hashes: allHashes }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || t('inviteContactsPage.matchFailed'));
      const matchByHash = new Map<string, { userId: string; name?: string; avatarUrl?: string }>(
        (data.matches ?? []).map((m: { hash: string; userId: string; name?: string; avatarUrl?: string }) => [m.hash, m]),
      );
      const enriched: MatchedContact[] = deviceContacts.map((c) => {
        const hangelUser = c.phones
          .map((p) => matchByHash.get(phoneToHash.get(p)!))
          .find((m): m is NonNullable<typeof m> => Boolean(m));
        return { contact: c, hangelUser };
      });
      // Hangel kullanıcıları önce
      enriched.sort((a, b) => (b.hangelUser ? 1 : 0) - (a.hangelUser ? 1 : 0));
      setContacts(enriched);
      setScanned(true);
    } catch (e) {
      toast({ variant: 'destructive', title: t('common.errorTitle'), description: e instanceof Error ? e.message : t('common.unknownError') });
    } finally {
      setLoading(false);
    }
  };

  const filtered = search
    ? contacts.filter((c) => c.contact.name.toLowerCase().includes(search.toLowerCase()))
    : contacts;

  const hangelCount = contacts.filter((c) => c.hangelUser).length;

  if (isUserLoading) {
    return <div className="min-h-dvh flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-black tracking-tight">{t('inviteContactsPage.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('inviteContactsPage.subtitle')}
        </p>
      </div>

      {!scanned && !isNative && (
        // Web hard-wall: rehber taraması yalnızca mobil uygulamada çalışır.
        // Dead-end yerine net mesaj + çalışan alternatif (/invite → vCard/CSV).
        <Card><CardContent className="pt-6 text-center text-sm space-y-4">
          <Smartphone className="h-10 w-10 text-muted-foreground mx-auto" />
          <div className="space-y-1.5">
            <p className="font-semibold text-foreground">{t('inviteContactsPage.nativeRequiredTitle')}</p>
            <p className="text-muted-foreground leading-relaxed">{t('inviteContactsPage.nativeRequiredDesc')}</p>
          </div>
          <Button asChild className="w-full h-12 rounded-xl">
            <Link href="/invite">
              {t('inviteContactsPage.webAlternativeCta')} <ArrowRight className="h-4 w-4 ml-1.5" />
            </Link>
          </Button>
        </CardContent></Card>
      )}

      {!scanned && isNative && (
        <Card><CardContent className="pt-6 text-center text-sm space-y-3">
          <Users className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground leading-relaxed">
            {t('inviteContactsPage.privacyPrefix')} <span className="font-bold">SHA-256 hash</span>{t('inviteContactsPage.privacySuffix')}
          </p>
          <Button onClick={scan} disabled={loading} className="w-full h-12 rounded-xl">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('inviteContactsPage.scanCta')}
          </Button>
        </CardContent></Card>
      )}

      {scanned && (
        <>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{contacts.length} {t('inviteContactsPage.scannedSuffix')}</span>
            <span className="font-bold text-primary">{hangelCount} {t('inviteContactsPage.hangelUsersSuffix')}</span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t('inviteContactsPage.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            {filtered.length === 0 && (
              <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-3 opacity-30" />
                <p>{t('inviteContactsPage.noResults')}</p>
              </CardContent></Card>
            )}
            {filtered.map((m, idx) => (
              <Card key={`${m.contact.name}-${idx}`}>
                <CardContent className="py-2.5 flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    {m.hangelUser?.avatarUrl && <AvatarImage src={m.hangelUser.avatarUrl} />}
                    <AvatarFallback className="text-xs">{m.contact.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{m.contact.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{m.contact.phones[0]}</p>
                  </div>
                  {m.hangelUser ? (
                    <Button asChild size="sm" variant="outline" className="rounded-xl shrink-0">
                      <Link href={`/u/${m.hangelUser.userId}`}>{t('inviteContactsPage.profileCta')}</Link>
                    </Button>
                  ) : (
                    <Button asChild size="sm" className="rounded-xl shrink-0">
                      <a href={`sms:${m.contact.phones[0]}?body=${encodeURIComponent(t('inviteContactsPage.smsBody'))}`}>
                        <UserPlus className="h-3.5 w-3.5 mr-1" /> {t('inviteContactsPage.inviteCta')}
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
