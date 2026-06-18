'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import {
  Send,
  Activity,
  ChevronRight,
  Mail,
  MessageSquare,
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

interface NavItem { href: string; icon: typeof Send; color: string; label: string; desc: string }
// Birincil işlemler — büyük kartlar.
const PRIMARY: NavItem[] = [
  { href: '/super-admin/messaging/workspace-mail', icon: Mail, color: 'bg-primary', label: 'Workspace Toplu Mail', desc: 'hangel kendi Workspace adresinden outreach datasına ya da yüklenen listeye toplu e-posta.' },
  { href: '/super-admin/outreach', icon: Megaphone, color: 'bg-pink-500', label: 'Outreach Veritabanı', desc: 'Vakıf + dernek + GSB müdürlükleri + manuel kontaklar.' },
  { href: '/super-admin/messaging/send-hangel', icon: MessageSquare, color: 'bg-orange-500', label: 'Toplu SMS', desc: 'hangel adına test + toplu SMS gönderimi.' },
  { href: '/super-admin/messaging/campaigns', icon: Send, color: 'bg-violet-500', label: 'Kampanyalar', desc: 'Geçmiş kampanyalar + analitik.' },
];
// İkincil araçlar — küçük linkler (gerekince kullanılır).
const SECONDARY: { href: string; label: string }[] = [
  { href: '/super-admin/messaging/templates', label: 'Şablonlar' },
  { href: '/super-admin/messaging/whatsapp/templates', label: 'WhatsApp Şablonları' },
  { href: '/super-admin/messaging/segments', label: 'Segmentler' },
  { href: '/super-admin/messaging/pricing', label: 'Pricing' },
  { href: '/super-admin/messaging/ngo-wallets', label: 'NGO Cüzdanları' },
  { href: '/super-admin/messaging/providers', label: 'Provider Ayarları' },
  { href: '/super-admin/messaging/audit', label: 'Audit Log' },
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PRIMARY.map((item) => {
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

      <div className="space-y-2">
        <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Diğer araçlar</h2>
        <div className="flex flex-wrap gap-2">
          {SECONDARY.map((s) => (
            <Link key={s.href} href={s.href} className="rounded-full border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              {s.label}
            </Link>
          ))}
        </div>
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
