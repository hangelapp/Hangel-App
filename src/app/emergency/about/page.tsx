'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Droplets, Siren, MapPin, Bell, Users } from 'lucide-react';
import { useTranslation } from '@/components/providers/language-provider';

// PDF-5: Anon ziyaretçilere açık tanıtım sayfası.
// Acil afet bildirimi + kan ihtiyacı modüllerini anlatır,
// alttaki "Sen de katıl" CTA'sı /login/selection?action=register'a yönlendirir.
// Auth gerektirmez — public marketing rotası.
export default function EmergencyAboutPage() {
  const { t } = useTranslation();

  const features = [
    {
      icon: MapPin,
      title: t('emergencyAbout.feature1.title'),
      desc: t('emergencyAbout.feature1.desc'),
    },
    {
      icon: Bell,
      title: t('emergencyAbout.feature2.title'),
      desc: t('emergencyAbout.feature2.desc'),
    },
    {
      icon: Users,
      title: t('emergencyAbout.feature3.title'),
      desc: t('emergencyAbout.feature3.desc'),
    },
  ];

  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-destructive/10 via-destructive/5 to-background">
        <div className="mx-auto max-w-3xl px-6 py-16 sm:py-24 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/15">
            <Siren className="h-8 w-8 text-destructive" aria-hidden="true" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
            {t('emergencyAbout.heroTitle')}
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            {t('emergencyAbout.heroLead')}
          </p>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            {t('emergencyAbout.heroSubLead')}
          </p>
        </div>
      </section>

      {/* Modules */}
      <section className="mx-auto max-w-4xl px-6 py-12">
        <div className="grid gap-6 sm:grid-cols-2">
          <Card className="border-destructive/20">
            <CardContent className="p-6">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                  <Siren className="h-5 w-5 text-destructive" aria-hidden="true" />
                </div>
                <h2 className="text-lg font-bold">{t('emergencyAbout.disasterTitle')}</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('emergencyAbout.disasterDesc')}
              </p>
            </CardContent>
          </Card>

          <Card className="border-destructive/20">
            <CardContent className="p-6">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                  <Droplets className="h-5 w-5 text-destructive" aria-hidden="true" />
                </div>
                <h2 className="text-lg font-bold">{t('emergencyAbout.bloodTitle')}</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('emergencyAbout.bloodDesc')}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-4xl px-6 pb-12">
        <h2 className="mb-6 text-center text-xl sm:text-2xl font-bold">
          {t('emergencyAbout.featuresTitle')}
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.title} className="bg-card/60">
                <CardContent className="p-5">
                  <Icon className="mb-3 h-6 w-6 text-primary" aria-hidden="true" />
                  <h3 className="mb-1 text-sm font-bold">{f.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-2xl px-6 pb-20 text-center">
        <div className="rounded-2xl bg-primary/5 p-8 sm:p-10">
          <h2 className="text-2xl font-black tracking-tight">{t('emergencyAbout.ctaTitle')}</h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            {t('emergencyAbout.ctaLead')}
          </p>
          <Button
            asChild
            size="lg"
            className="mt-6 h-12 rounded-full px-8 font-bold"
          >
            <Link href="/login/selection?action=register">
              {t('emergencyAbout.ctaButton')}
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
