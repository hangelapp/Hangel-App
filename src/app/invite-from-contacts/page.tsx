'use client';

/**
 * /invite-from-contacts — Rehberden Hangel kullanıcılarını bul, davet et.
 *
 * iOS native: @capacitor-community/contacts plugin → tüm telefon numaraları
 * Privacy: SHA-256 hash'lenip /api/contacts/sync'e gönderilir
 * Eşleşenler → Hangel kullanıcısı (takip ekle)
 * Eşleşmeyenler → SMS/WhatsApp invite link (web fallback)
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { Users, Loader2, UserPlus, Search } from 'lucide-react';

import { useUser } from '@/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Capacitor } from '@capacitor/core';
import { getDeviceContacts, hashPhoneForMatch, type ContactSummary } from '@/lib/native-contacts';
import { useToast } from '@/hooks/use-toast';

interface MatchedContact {
  contact: ContactSummary;
  hangelUser?: { userId: string; name?: string; avatarUrl?: string };
}

export default function InviteFromContactsPage() {
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<MatchedContact[]>([]);
  const [search, setSearch] = useState('');
  const [scanned, setScanned] = useState(false);

  const scan = async () => {
    if (!user) return;
    if (!Capacitor.isNativePlatform()) {
      toast({ variant: 'destructive', title: 'iOS native gerekli', description: 'Bu özellik sadece Hangel iOS app\'inde çalışır.' });
      return;
    }
    setLoading(true);
    try {
      const deviceContacts = await getDeviceContacts();
      if (deviceContacts.length === 0) {
        toast({ variant: 'destructive', title: 'Rehber boş', description: 'İzin verilmedi veya rehberde numara yok.' });
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
      if (!res.ok || !data.ok) throw new Error(data.message || 'Eşleştirme başarısız');
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
      toast({ variant: 'destructive', title: 'Hata', description: e instanceof Error ? e.message : 'Bilinmeyen' });
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
        <h1 className="text-2xl font-black tracking-tight">Rehberden Davet Et</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Rehberindeki Hangel kullanıcılarını bul + olmayanları davet et.
        </p>
      </div>

      {!scanned && (
        <Card><CardContent className="pt-6 text-center text-sm space-y-3">
          <Users className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground leading-relaxed">
            Rehberinizdeki telefon numaraları <span className="font-bold">SHA-256 hash</span>&apos;lenerek sunucuya gönderilir.
            Hangel sadece eşleşme sonucunu döner, raw numaranızı saklamaz.
          </p>
          <Button onClick={scan} disabled={loading} className="w-full h-12 rounded-xl">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Rehberi Tara'}
          </Button>
        </CardContent></Card>
      )}

      {scanned && (
        <>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{contacts.length} kişi tarandı</span>
            <span className="font-bold text-primary">{hangelCount} Hangel kullanıcısı</span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Kişi ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10 rounded-xl" />
          </div>
          <div className="space-y-1.5">
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
                      <Link href={`/u/${m.hangelUser.userId}`}>Profil</Link>
                    </Button>
                  ) : (
                    <Button asChild size="sm" className="rounded-xl shrink-0">
                      <a href={`sms:${m.contact.phones[0]}?body=${encodeURIComponent('hangel.org.tr — toplumsal sorunlara birlikte çözüm: https://hangel.org.tr')}`}>
                        <UserPlus className="h-3.5 w-3.5 mr-1" /> Davet
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
