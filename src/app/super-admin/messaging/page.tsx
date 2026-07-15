'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import {
  Activity,
  ArrowRight,
  Building2,
  ChevronRight,
  Coins,
  Database,
  History,
  LayoutTemplate,
  Mail,
  MessageCircle,
  MessageSquare,
  ScrollText,
  Settings2,
  Users,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { COLLECTIONS } from '@/firebase/collections';

interface CampaignRow {
  id: string;
  name?: string;
  channel?: 'sms' | 'email';
  useCase?: string;
  status?: string;
  createdAt?: { toDate?: () => Date } | null;
  stats?: { queued?: number; sent?: number; failed?: number };
}

interface NavItem { href: string; icon: typeof Mail; color: string; label: string; desc: string }
// İkinci sıra — orta boy kartlar.
const SECONDARY_CARDS: NavItem[] = [
  {
    href: '/super-admin/messaging/campaigns',
    icon: History,
    color: 'bg-violet-500',
    label: 'Kampanya Geçmişi',
    desc: 'Gönderilmiş ve süren kampanyalar, gönderim istatistikleri.',
  },
  {
    href: '/super-admin/messaging/send-hangel',
    icon: MessageSquare,
    color: 'bg-orange-500',
    label: 'Toplu SMS',
    desc: 'SMS gönderimi — mail değil.',
  },
  {
    href: '/super-admin/messaging/workspace-mail',
    icon: Building2,
    color: 'bg-sky-500',
    label: 'Dış Kurumlara Mail',
    desc: 'Outreach/vakıf-dernek listelerine Workspace üzerinden — kayıtlı kullanıcılara DEĞİL.',
  },
];
// Gelişmiş araçlar — accordion içindeki küçük linkler.
const ADVANCED: { href: string; icon: typeof Mail; label: string }[] = [
  { href: '/super-admin/messaging/templates', icon: LayoutTemplate, label: 'Şablonlar' },
  { href: '/super-admin/messaging/segments', icon: Users, label: 'Segmentler' },
  { href: '/super-admin/messaging/whatsapp/templates', icon: MessageCircle, label: 'WhatsApp Şablonları' },
  { href: '/super-admin/messaging/pricing', icon: Coins, label: 'Fiyatlandırma' },
  { href: '/super-admin/messaging/ngo-wallets', icon: Wallet, label: 'STK Cüzdanları' },
  { href: '/super-admin/messaging/providers', icon: Settings2, label: 'Sağlayıcı Ayarları' },
  { href: '/super-admin/messaging/audit', icon: ScrollText, label: 'Denetim Kaydı' },
  { href: '/super-admin/outreach', icon: Database, label: 'Outreach Veritabanı' },
];

function StatusBadge({ status }: { status?: string }) {
  const map: Record<string, string> = {
    draft: 'bg-gray-200 text-gray-700',
    scheduled: 'bg-amber-200 text-amber-800',
    enqueuing: 'bg-blue-200 text-blue-800',
    sending: 'bg-violet-200 text-violet-800',
    completed: 'bg-emerald-200 text-emerald-800',
    failed: 'bg-rose-200 text-rose-800',
    cancelled: 'bg-gray-300 text-gray-700',
  };
  return <Badge className={cn('text-xs', map[status ?? 'draft'] ?? map.draft)}>{status ?? 'taslak'}</Badge>;
}

export default function MessagingHub() {
  const db = useFirestore();
  const recentQuery = useMemoFirebase(
    () => query(collection(db, COLLECTIONS.campaigns), orderBy('createdAt', 'desc'), limit(5)),
    [db]
  );
  const { data: recent, isLoading } = useCollection<CampaignRow>(recentQuery);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-headline">Mesajlaşma</h1>
        <p className="text-muted-foreground mt-1">
          Kullanıcılara ve kurumlara mail, SMS ve kampanya gönderimi — tek yerden.
        </p>
      </div>

      {/* Hero — birincil işlem: kullanıcılara toplu mail */}
      <Link href="/super-admin/messaging/mail" className="block group">
        <Card className="bg-primary text-primary-foreground border-primary hover:shadow-lg transition-shadow">
          <CardContent className="flex items-center gap-4 p-6 md:p-8">
            <div className="h-14 w-14 md:h-16 md:w-16 shrink-0 rounded-2xl bg-primary-foreground/15 flex items-center justify-center">
              <Mail className="h-7 w-7 md:h-8 md:w-8" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl md:text-2xl font-bold font-headline break-words">Mail Gönder</h2>
              <p className="mt-1 text-sm md:text-base text-primary-foreground/85 break-words">
                Kullanıcılara kolay toplu mail: kitle seç, yaz, gönder.
              </p>
            </div>
            <ArrowRight className="h-6 w-6 shrink-0 transition-transform group-hover:translate-x-1" />
          </CardContent>
        </Card>
      </Link>

      {/* Outreach Veritabanı — dernek / vakıf / il müdürlükleri iletişim verisi.
          Belirgin buton (eskiden yalnız accordion'da gömülüydü → bulunamıyordu). */}
      <Link href="/super-admin/outreach" className="block group">
        <Card className="border-primary/30 bg-primary/5 hover:shadow-md transition-shadow">
          <CardContent className="flex items-center gap-4 p-5 md:p-6">
            <div className="h-12 w-12 shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Database className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg md:text-xl font-bold font-headline break-words">Outreach Veritabanı</h2>
              <p className="mt-0.5 text-sm text-muted-foreground break-words">
                Dernek, vakıf ve il müdürlükleri iletişim (telefon / e-posta) verisi — ara, filtrele, kampanyaya gönder.
              </p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-primary transition-transform group-hover:translate-x-1" />
          </CardContent>
        </Card>
      </Link>

      {/* İkinci sıra — üç orta kart */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SECONDARY_CARDS.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="block">
              <Card className="hover:shadow-md transition-shadow h-full">
                <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                  <div className={cn('h-10 w-10 shrink-0 rounded-lg flex items-center justify-center', item.color)}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base break-words">{item.label}</CardTitle>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-xs break-words">{item.desc}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Gelişmiş — varsayılan kapalı */}
      <Accordion type="single" collapsible className="rounded-lg border px-4">
        <AccordionItem value="advanced" className="border-b-0">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline">
            <span className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-muted-foreground" />
              Gelişmiş
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-wrap gap-2 pt-1">
              {ADVANCED.map((s) => {
                const Icon = s.icon;
                return (
                  <Link
                    key={s.href}
                    href={s.href}
                    className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {s.label}
                  </Link>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-violet-500" />
            <CardTitle className="text-base">Son Kampanyalar</CardTitle>
          </div>
          <Link href="/super-admin/messaging/campaigns" className="text-xs text-muted-foreground hover:underline">
            Hepsini gör →
          </Link>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Yükleniyor…</p>
          ) : !recent || recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henüz kampanya yok.</p>
          ) : (
            <ul className="divide-y">
              {recent.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/super-admin/messaging/campaigns/${c.id}`}
                    className="flex items-center gap-3 py-2 hover:bg-muted/40 px-2 -mx-2 rounded"
                  >
                    {c.channel === 'email' ? (
                      <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className="flex-1 min-w-0 break-words text-sm">{c.name ?? c.id}</span>
                    <span className="text-xs text-muted-foreground">
                      {c.stats?.sent ?? 0}/{c.stats?.queued ?? 0}
                    </span>
                    <StatusBadge status={c.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
