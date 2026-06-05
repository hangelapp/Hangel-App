'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import {
  Send,
  FileText,
  Filter,
  History,
  Settings as SettingsIcon,
  Activity,
  ChevronRight,
  Mail,
  MessageSquare,
  MessageCircle,
  Coins,
  Wallet,
  Megaphone,
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

const NAV = [
  { href: '/super-admin/outreach', icon: Megaphone, color: 'bg-pink-500', label: 'Outreach / Tanıtım Veritabanı', desc: '6.680 vakıf + 100.967 dernek + manuel kontaklar. Hangel\'i tanıştırmak için toplu mail / SMS.' },
  { href: '/super-admin/messaging/campaigns', icon: Send, color: 'bg-violet-500', label: 'Kampanyalar', desc: 'Yeni kampanya oluştur, geçmişi gör, detay analitiği incele.' },
  { href: '/super-admin/messaging/templates', icon: FileText, color: 'bg-sky-500', label: 'Şablonlar', desc: 'Tekrar kullanılabilir SMS / e-posta şablonları.' },
  { href: '/super-admin/messaging/whatsapp/templates', icon: MessageCircle, color: 'bg-emerald-600', label: 'WhatsApp Şablonları', desc: 'Meta-onaylı WhatsApp template\'leri.' },
  { href: '/super-admin/messaging/segments', icon: Filter, color: 'bg-emerald-500', label: 'Segmentler', desc: 'Filtre tabanlı alıcı kitleleri tanımla.' },
  { href: '/super-admin/messaging/pricing', icon: Coins, color: 'bg-amber-500', label: 'Pricing', desc: 'Tier indirimleri, ücretsiz kotalar, KDV ve çarpanlar.' },
  { href: '/super-admin/messaging/ngo-wallets', icon: Wallet, color: 'bg-emerald-700', label: 'NGO Cüzdanları', desc: 'NGO bakiyeleri + manuel top-up / düzeltme.' },
  { href: '/super-admin/messaging/providers', icon: SettingsIcon, color: 'bg-yellow-500', label: 'Provider Ayarları', desc: 'SMS/E-posta sağlayıcısı, sender ID, rate limit ve İYS modu.' },
  { href: '/super-admin/messaging/audit', icon: History, color: 'bg-rose-500', label: 'Audit Log', desc: 'Kim, ne zaman, ne gönderdi — denetim kaydı.' },
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
        <h1 className="text-2xl md:text-3xl font-bold font-headline">Toplu SMS & E-Posta</h1>
        <p className="text-muted-foreground mt-1">
          Kampanya, şablon, segment ve gönderim analitikleri. KVKK/İYS uyumlu.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="block">
              <Card className="hover:shadow-md transition-shadow h-full">
                <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                  <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', item.color)}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">{item.label}</CardTitle>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-xs">{item.desc}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

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
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="flex-1 truncate text-sm">{c.name ?? c.id}</span>
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
