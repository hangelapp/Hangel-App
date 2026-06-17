'use client';

/**
 * /ngo-admin/whatsapp-business
 *
 * WhatsApp İş (WABA) ana sayfa — STK admin için.
 *
 * Üç paralel API çağrısı (numbers / templates / conversations) + 4 KPI + hızlı
 * eylemler + son aktivite listesi. Mesaj sayımı bu ayın başından itibaren
 * outbound mesajları konuşmalardaki lastMessageAt üzerinden tahmin eder
 * (gerçek metric backend toplaması Faz 2'ye bırakıldı; KPI'ı abartmamak için
 * yalnız bu ay outbound olan thread'ler sayılır).
 */

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Loader2,
  Phone,
  FileText,
  Send,
  Inbox,
  MessageCircle,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  AlertTriangle,
  PlusCircle,
} from 'lucide-react';
import { useUser } from '@/firebase';
import { messagingFetch } from '@/lib/messaging/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface NumberRow {
  id: string;
  phoneNumber: string;
  displayName: string;
  displayNameStatus: string;
  qualityRating: string | null;
  status: string;
}

interface TemplateRow {
  id: string;
  name: string;
  category: string;
  language: string;
  status: string;
}

interface ConversationRow {
  id: string;
  contactPhone: string;
  contactName: string | null;
  lastMessageAt: string | null;
  lastMessageBody: string;
  lastMessageDirection: 'inbound' | 'outbound' | null;
  unreadCount: number;
  conversationWindowExpiresAt: string | null;
  windowOpen: boolean;
}

function startOfThisMonthIso(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

function timeAgo(iso: string | null): string {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return 'az önce';
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)} dk önce`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)} sa önce`;
  return `${Math.floor(ms / 86_400_000)} gün önce`;
}

export default function WhatsAppBusinessHubPage() {
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const [numbers, setNumbers] = useState<NumberRow[]>([]);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (isUserLoading || !user) return;
    let active = true;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const [numbersRes, templatesRes, convosRes] = await Promise.all([
          messagingFetch<{ numbers: NumberRow[] }>(
            '/api/ngo-admin/whatsapp-business/numbers',
          ),
          messagingFetch<{ templates: TemplateRow[] }>(
            '/api/ngo-admin/whatsapp-business/templates',
          ),
          messagingFetch<{ conversations: ConversationRow[] }>(
            '/api/ngo-admin/whatsapp-business/conversations?limit=10',
          ),
        ]);
        if (!active) return;
        setNumbers(numbersRes.numbers ?? []);
        setTemplates(templatesRes.templates ?? []);
        setConversations(convosRes.conversations ?? []);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (active) {
          setLoadError(message);
          toast({
            variant: 'destructive',
            title: 'WhatsApp paneli yüklenemedi',
            description: message,
          });
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user, isUserLoading, toast]);

  const totalNumbers = numbers.length;
  const activeNumbers = useMemo(
    () => numbers.filter((n) => n.status === 'active').length,
    [numbers],
  );
  const approvedTemplates = useMemo(
    () => templates.filter((t) => t.status === 'approved').length,
    [templates],
  );
  const openConversations = useMemo(
    () => conversations.filter((c) => c.unreadCount > 0).length,
    [conversations],
  );
  const monthlyOutbound = useMemo(() => {
    const monthStart = startOfThisMonthIso();
    return conversations.filter(
      (c) =>
        c.lastMessageDirection === 'outbound' &&
        c.lastMessageAt &&
        c.lastMessageAt >= monthStart,
    ).length;
  }, [conversations]);

  if (isUserLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-sm text-muted-foreground">Oturum açın.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-6xl space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/ngo-admin">Yönetim Paneli</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>WhatsApp İş</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-emerald-600" /> WhatsApp İş
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            STK'nızın WhatsApp Business hesabını yönetin: numaralar, şablonlar,
            toplu gönderim ve gelen kutusu.
          </p>
        </div>
        <Link href="/ngo-admin/whatsapp-business/numbers/new">
          <Button className="gap-1.5">
            <PlusCircle className="h-4 w-4" /> Numara Bağla
          </Button>
        </Link>
      </div>

      {loadError && (
        <Card className="border-rose-300 bg-rose-50/40">
          <CardHeader className="flex flex-row items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-rose-600" />
            <CardTitle className="text-base">Veriler yüklenemedi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{loadError}</p>
          </CardContent>
        </Card>
      )}

      {/* KPI satırı */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          icon={Phone}
          color="bg-emerald-500"
          label="Aktif Numaralar"
          value={`${activeNumbers}`}
          hint={
            totalNumbers > 0
              ? `${totalNumbers} numara bağlı`
              : 'Henüz numara yok'
          }
        />
        <KpiCard
          icon={FileText}
          color="bg-blue-500"
          label="Onaylı Şablonlar"
          value={`${approvedTemplates}`}
          hint={
            templates.length > 0
              ? `${templates.length} şablon toplam`
              : 'Henüz şablon yok'
          }
        />
        <KpiCard
          icon={Send}
          color="bg-violet-500"
          label="Bu Ayki Gönderim"
          value={`${monthlyOutbound}`}
          hint="Outbound konuşmalar"
        />
        <KpiCard
          icon={Inbox}
          color="bg-amber-500"
          label="Açık Konuşmalar"
          value={`${openConversations}`}
          hint="Okunmamış"
        />
      </div>

      {/* Hızlı eylemler */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hızlı Eylemler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <QuickAction
              href="/ngo-admin/whatsapp-business/numbers/new"
              icon={Phone}
              color="bg-emerald-600"
              label="Numara Bağla"
            />
            <QuickAction
              href="/ngo-admin/whatsapp-business/templates/new"
              icon={FileText}
              color="bg-blue-600"
              label="Şablon Oluştur"
            />
            <QuickAction
              href="/ngo-admin/whatsapp-business/send"
              icon={Send}
              color="bg-violet-600"
              label="Toplu Gönder"
            />
            <QuickAction
              href="/ngo-admin/whatsapp-business/inbox"
              icon={Inbox}
              color="bg-amber-600"
              label="Gelen Kutusu"
              badge={openConversations > 0 ? openConversations : undefined}
            />
          </div>
        </CardContent>
      </Card>

      {/* Son aktivite */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Son Aktivite</CardTitle>
          <Link href="/ngo-admin/whatsapp-business/inbox">
            <Button variant="ghost" size="sm" className="text-xs">
              Tümünü Gör <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {conversations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Henüz konuşma yok. Bir numara bağlayıp şablon oluşturduktan sonra
              gelen mesajlar burada görünecek.
            </p>
          ) : (
            <ul className="divide-y">
              {conversations.slice(0, 10).map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/ngo-admin/whatsapp-business/inbox/${encodeURIComponent(c.id)}`}
                    className="flex items-center gap-3 py-2.5 hover:bg-muted/40 px-2 -mx-2 rounded"
                  >
                    {c.lastMessageDirection === 'inbound' ? (
                      <ArrowDownLeft className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : c.lastMessageDirection === 'outbound' ? (
                      <ArrowUpRight className="h-4 w-4 text-blue-600 shrink-0" />
                    ) : (
                      <MessageCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium truncate">
                          {c.contactName || c.contactPhone}
                        </span>
                        {c.contactName && (
                          <span className="text-xs text-muted-foreground truncate">
                            {c.contactPhone}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {c.lastMessageBody || '(boş mesaj)'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {timeAgo(c.lastMessageAt)}
                      </span>
                      <div className="flex items-center gap-1">
                        {c.unreadCount > 0 && (
                          <Badge className="bg-amber-500 text-white text-[10px] h-4 px-1.5">
                            {c.unreadCount}
                          </Badge>
                        )}
                        {!c.windowOpen && (
                          <Badge
                            variant="outline"
                            className="text-[10px] h-4 px-1.5 border-rose-300 text-rose-700"
                          >
                            Pencere kapalı
                          </Badge>
                        )}
                      </div>
                    </div>
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

function KpiCard({
  icon: Icon,
  color,
  label,
  value,
  hint,
}: {
  icon: React.ElementType;
  color: string;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'h-9 w-9 rounded-md flex items-center justify-center shrink-0',
              color,
            )}
          >
            <Icon className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold leading-tight">{value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {hint}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickAction({
  href,
  icon: Icon,
  color,
  label,
  badge,
}: {
  href: string;
  icon: React.ElementType;
  color: string;
  label: string;
  badge?: number;
}) {
  return (
    <Link href={href}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="flex flex-col items-center justify-center gap-2 py-5 relative">
          {badge !== undefined && (
            <Badge className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] h-4 px-1.5">
              {badge}
            </Badge>
          )}
          <div
            className={cn(
              'h-10 w-10 rounded-full flex items-center justify-center',
              color,
            )}
          >
            <Icon className="h-5 w-5 text-white" />
          </div>
          <span className="text-sm font-medium text-center">{label}</span>
        </CardContent>
      </Card>
    </Link>
  );
}
