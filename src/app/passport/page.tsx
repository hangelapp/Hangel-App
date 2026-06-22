'use client';

/**
 * Sosyal Etki Pasaportu sayfası — Faz 3.
 *
 * Kullanıcının hangeldeki tüm sosyal etkisini tek bir kart altında özetler:
 * impact score, saatler, etkinlikler, bağışlar, rozetler, sertifikalar.
 * Veri /api/users/me/passport agregasyon endpoint'inden alınır (24h cache).
 *
 * Paylaşım: Capacitor native share sheet (iOS/Android) veya Web Share API
 * fallback. Wallet pass entegrasyonu PassKit Faz 1.2 ile aktif olur.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Capacitor } from '@capacitor/core';
import { openExternalUrl } from '@/lib/capacitor';
import { Share } from '@capacitor/share';
import {
  Award, Loader2, Calendar, Heart, Clock, Sparkles, ExternalLink, Share2, Wallet, RefreshCw,
} from 'lucide-react';

import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/components/providers/language-provider';

interface PassportData {
  totalVolunteerHours: number;
  totalEvents: number;
  totalCampaigns: number;
  totalDonationsTry: number;
  badges: Array<{ id: string; name: string; iconUrl?: string | null; awardedAt?: string | null }>;
  certificates: Array<{ id: string; title: string; issuedBy?: string; issuedAt?: string | null }>;
  impactScore: number;
  lastUpdatedAt: string;
}

const formatTry = (n: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n);
const formatNum = (n: number) => new Intl.NumberFormat('tr-TR').format(n);

export default function PassportPage() {
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [data, setData] = useState<PassportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (force: boolean) => {
    if (!user) return;
    if (force) setRefreshing(true); else setLoading(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/users/me/passport${force ? '?force=1' : ''}`, {
        headers: { authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.passport) throw new Error('Passport boş döndü');
      setData(json.passport as PassportData);
    } catch (e) {
      toast({ variant: 'destructive', title: t('passportPage.loadFailed'), description: e instanceof Error ? e.message : t('passportPage.unknownError') });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!user?.uid) return;
    void load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const share = async () => {
    if (!data || !user) return;
    const text = `${t('passportPage.shareLine1')}: ${formatNum(data.impactScore)}\n`
      + `${formatNum(data.totalVolunteerHours)} ${t('passportPage.shareHours')}\n`
      + `${formatNum(data.totalEvents)} ${t('passportPage.shareEvents')}\n`
      + `${formatTry(data.totalDonationsTry)} ${t('passportPage.shareDonations')}\n`
      + `\n#hangel #sosyaletki`;
    const url = `https://hangel.org.tr/profile/${user.uid}`;

    if (Capacitor.isNativePlatform()) {
      try {
        await Share.share({ title: t('passportPage.shareTitle'), text, url });
      } catch { /* iptal */ }
      return;
    }

    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ title: t('passportPage.shareTitle'), text, url });
        return;
      } catch { /* iptal */ }
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      toast({ title: t('passportPage.copied'), description: t('passportPage.copiedDesc') });
    } catch {
      /* sessiz */
    }
  };

  const addToWallet = async () => {
    if (!user) { toast({ variant: 'destructive', title: 'Giriş gerekli' }); return; }
    try {
      // Token URL'de (kısa ömürlü) — .pkpass'i Safari/SFSafariViewController açar,
      // iOS "Cüzdana Ekle" sayfasını gösterir. WKWebView blob'dan açamadığı için şart.
      const token = await user.getIdToken();
      const url = new URL(`/api/passes/donor/${user.uid}?token=${encodeURIComponent(token)}`, window.location.origin).toString();
      await openExternalUrl(url);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Cüzdana eklenemedi', description: e instanceof Error ? e.message : 'Tekrar deneyin.' });
    }
  };

  if (isUserLoading || (loading && !data)) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-6 text-center">
        <p className="text-muted-foreground">{t('passportPage.signInRequired')}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-dvh bg-secondary/40 pb-24">
      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">

        {/* Hero kart — Impact Score */}
        <Card className="overflow-hidden border-none shadow-xl bg-gradient-to-br from-primary via-primary to-orange-600 text-white rounded-[2rem]">
          <CardContent className="p-7 sm:p-9 text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">
              <Sparkles className="h-3 w-3" /> {t('passportPage.badge')}
            </div>
            <h1 className="text-7xl font-black leading-none">{formatNum(data.impactScore)}</h1>
            <p className="text-sm opacity-90">{t('passportPage.totalScore')}</p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button size="sm" variant="secondary" onClick={share} className="rounded-full bg-white/15 backdrop-blur text-white hover:bg-white/25 border-0">
                <Share2 className="h-4 w-4 mr-1.5" /> {t('passportPage.share')}
              </Button>
              {Capacitor.getPlatform() === 'ios' && (
                <Button size="sm" variant="secondary" onClick={addToWallet} className="rounded-full bg-white/15 backdrop-blur text-white hover:bg-white/25 border-0">
                  <Wallet className="h-4 w-4 mr-1.5" /> {t('passportPage.addToWallet')}
                </Button>
              )}
              <Button size="sm" variant="secondary" onClick={() => load(true)} disabled={refreshing} className="rounded-full bg-white/15 backdrop-blur text-white hover:bg-white/25 border-0">
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 4 stat */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Clock} label={t('passportPage.volHours')} value={formatNum(data.totalVolunteerHours)} color="text-blue-600 bg-blue-50" />
          <StatCard icon={Calendar} label={t('passportPage.events')} value={formatNum(data.totalEvents)} color="text-emerald-600 bg-emerald-50" />
          <StatCard icon={Sparkles} label={t('passportPage.campaigns')} value={formatNum(data.totalCampaigns)} color="text-violet-600 bg-violet-50" />
          <StatCard icon={Heart} label={t('passportPage.donations')} value={formatTry(data.totalDonationsTry)} color="text-rose-600 bg-rose-50" />
        </div>

        {/* Rozetler */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t('passportPage.badgesTitle')} ({data.badges.length})</h2>
          </div>
          {data.badges.length === 0 ? (
            <Card className="border-dashed bg-background/60 rounded-2xl">
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                <Award className="h-8 w-8 mx-auto mb-2 opacity-30" />
                {t('passportPage.badgesEmpty')}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {data.badges.map(b => (
                <Card key={b.id} className="border-none shadow-sm bg-background rounded-2xl overflow-hidden">
                  <CardContent className="p-3 text-center space-y-1.5">
                    <div className="aspect-square rounded-xl bg-primary/10 flex items-center justify-center">
                      {b.iconUrl
                        ? <img src={b.iconUrl} alt={b.name} className="w-10 h-10 object-contain" />
                        : <Award className="h-7 w-7 text-primary" />}
                    </div>
                    <p className="text-[11px] font-bold truncate">{b.name}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Sertifikalar */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t('passportPage.certsTitle')} ({data.certificates.length})</h2>
          </div>
          {data.certificates.length === 0 ? (
            <Card className="border-dashed bg-background/60 rounded-2xl">
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                {t('passportPage.certsEmpty')}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {data.certificates.map(c => (
                <Card key={c.id} className="border-none shadow-sm bg-background rounded-2xl">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                      <Award className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{c.title}</p>
                      {c.issuedBy && <p className="text-xs text-muted-foreground truncate">{c.issuedBy}</p>}
                    </div>
                    <Button asChild size="sm" variant="ghost" className="rounded-full" aria-label="Sertifikayı profilde gör">
                      <Link href="/profile?tab=badges-certificates">
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <p className="text-center text-[10px] text-muted-foreground pt-4">
          {t('passportPage.lastUpdate')}: {new Date(data.lastUpdatedAt).toLocaleString('tr-TR')}
        </p>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, color,
}: {
  icon: typeof Award;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Card className="border-none shadow-sm bg-background rounded-2xl">
      <CardContent className="p-4 space-y-2">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-black leading-tight">{value}</p>
          <p className="text-[11px] text-muted-foreground font-medium">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
