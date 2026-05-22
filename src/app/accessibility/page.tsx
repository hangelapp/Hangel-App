
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft,
    Eye,
    Ear,
    ShieldCheck,
    Globe,
    Scale,
    Clock,
    Type,
    Layers,
    Target,
    Volume2,
    History,
    MessageSquareWarning,
    Languages,
    Contrast,
    MoreHorizontal,
    AlignLeft,
    Pilcrow,
    Rows,
    Keyboard,
    Command,
    Undo2,
    Files,
    ShieldAlert,
    ListOrdered,
    CheckCircle,
    MousePointerClick,
    Maximize,
    VolumeX,
    ImageOff,
    Rss,
    FileVideo,
    Settings2,
    ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PublicFooter } from '@/components/layout/public-footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useWebPage } from '@/hooks/use-site-content';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useTranslation } from '@/components/providers/language-provider';

// Descriptive (read-only) feature row. This is a marketing/intro page: it ONLY
// describes the accessibility features available in /settings/accessibility.
// It must NOT render any functional controls (no Switch / Select / save logic).
const FeatureRow = ({ icon: Icon, label, iconColor, description }: { icon: React.ElementType, label: string, iconColor: string, description: string }) => (
    <div className="flex items-start p-4 text-sm sm:text-base border-b last:border-b-0">
        <div className={cn('p-1.5 rounded-lg mr-4 shrink-0', iconColor)}>
            <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 space-y-0.5">
            <p className="font-medium leading-snug">{label}</p>
            <p className="text-xs text-muted-foreground leading-snug">{description}</p>
        </div>
    </div>
);

export default function AccessibilityPublicPage() {
    const router = useRouter();
    const heroImage = PlaceHolderImages.find(img => img.id === 'accessibility-hero');
    const cms = useWebPage('accessibility');
    const { t } = useTranslation();

    // Static descriptions for the few features whose settings control is a
    // dropdown (so the shared translation entry has no `desc`). The copy mirrors
    // the real options exposed in /settings/accessibility.
    const fontSizeDesc = 'Yazı tipini Küçük, Normal, Büyük veya Çok Büyük olarak ayarlayabilirsiniz.';
    const lineHeightDesc = 'Satır aralığını 1.5x veya 2.0x genişliğe çıkararak okumayı kolaylaştırın.';
    const wordSpacingDesc = 'Kelimeler arasındaki boşluğu %10 veya %20 oranında artırın.';
    const paragraphSpacingDesc = 'Paragraflar arası boşluğu geniş veya çok geniş olarak ayarlayın.';
    const focusFrameDesc = 'Odak çerçevesini ince, kalın veya yüksek kontrastlı olarak belirleyin.';
    const screenReaderDesc = 'ARIA etiketleri ve anonslar ile ekran okuyucu uyumluluğunu güçlendirin.';

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-primary/30">
            {/* Navigation */}
            <header className="fixed top-0 inset-x-0 z-[100] bg-white/80 backdrop-blur-md border-b border-black/5">
                <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-6xl">
                    <Button onClick={() => router.back()} variant="ghost" className="rounded-full h-8 px-3 text-[12px] font-medium">
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> {t('marketing.accessibility.backShort')}
                    </Button>
                    <span className="text-[10px] font-bold tracking-tight uppercase hidden sm:inline">{t('marketing.accessibility.navLabel')}</span>
                    <Button asChild size="sm" className="h-7 rounded-full px-4 text-[11px] font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                        <Link href="/settings/accessibility">{t('marketing.accessibility.configureCta')}</Link>
                    </Button>
                </div>
            </header>

            <main>
                {/* Hero Section */}
                <section className="relative pt-24 md:pt-32 pb-16 md:pb-24 px-6 text-center bg-[#f5f5f7] overflow-hidden border-b border-black/5">
                    <div className="container mx-auto max-w-4xl space-y-6 relative z-10 animate-in fade-in-0 slide-in-from-bottom-4 duration-1000">
                        {cms.subtitle && (
                            <p className="text-sm font-bold uppercase tracking-widest text-primary">{cms.subtitle}</p>
                        )}
                        <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-[#1d1d1f] leading-[0.95]">
                            {cms.title || t('marketing.accessibility.heroTitleFallback')}
                        </h1>
                        <p className="text-lg md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto leading-tight">
                            {cms.description || t('marketing.accessibility.heroDescriptionFallback')}
                        </p>
                        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                            <Button asChild size="lg" className="rounded-full px-8 md:px-10 h-12 md:h-14 font-bold shadow-xl shadow-primary/20 text-base w-full sm:w-auto">
                                <Link href="/settings/accessibility">
                                    <Settings2 className="mr-2 h-5 w-5" />
                                    {t('marketing.accessibility.configureCta')}
                                </Link>
                            </Button>
                        </div>
                    </div>
                    <div className="relative w-full max-w-6xl mx-auto aspect-[16/9] md:aspect-[21/9] mt-12 md:mt-16 rounded-t-[2rem] md:rounded-t-[3rem] overflow-hidden shadow-2xl">
                        <Image
                            src={heroImage?.imageUrl || "https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2070&auto=format&fit=crop"}
                            alt={heroImage?.description || "Modern Library"}
                            fill
                            className="object-cover"
                            data-ai-hint={heroImage?.imageHint || "modern library"}
                        />
                    </div>
                </section>

                {/* --- Descriptive Feature Groups (informational only) --- */}
                <section className="p-4 space-y-10 animate-in fade-in-0 max-w-3xl mx-auto pb-16">
                    <div className="space-y-8 mt-16">
                        {/* Visual & Reading */}
                        <Card className="rounded-[2rem] overflow-hidden shadow-sm border-black/5">
                            <CardHeader className="bg-[#f5f5f7] border-b">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Eye className="h-5 w-5 text-indigo-500" />
                                    {t('marketing.accessibility.groupVisualTitle')}
                                </CardTitle>
                                <CardDescription className="text-xs font-medium">{t('marketing.accessibility.groupVisualDesc')}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="flex flex-col">
                                    <FeatureRow label={t('marketing.accessibility.items.highContrast.label')} icon={Contrast} iconColor="bg-indigo-500" description={t('marketing.accessibility.items.highContrast.desc')} />
                                    <FeatureRow label={t('marketing.accessibility.items.reflow.label')} icon={Rows} iconColor="bg-indigo-500" description={t('marketing.accessibility.items.reflow.desc')} />
                                    <FeatureRow label={t('marketing.accessibility.items.contrastInfo.label')} icon={ShieldCheck} iconColor="bg-indigo-500" description={t('marketing.accessibility.items.contrastInfo.desc')} />
                                    <FeatureRow label={t('marketing.accessibility.items.fontSize.label')} icon={Type} iconColor="bg-indigo-500" description={fontSizeDesc} />
                                    <FeatureRow label={t('marketing.accessibility.items.lineHeight.label')} icon={AlignLeft} iconColor="bg-indigo-500" description={lineHeightDesc} />
                                    <FeatureRow label={t('marketing.accessibility.items.wordSpacing.label')} icon={MoreHorizontal} iconColor="bg-indigo-500" description={wordSpacingDesc} />
                                    <FeatureRow label={t('marketing.accessibility.items.paragraphSpacing.label')} icon={Pilcrow} iconColor="bg-indigo-500" description={paragraphSpacingDesc} />
                                    <FeatureRow label={t('marketing.accessibility.items.separateText.label')} icon={Files} iconColor="bg-indigo-500" description={t('marketing.accessibility.items.separateText.desc')} />
                                    <FeatureRow label={t('marketing.accessibility.items.dyslexiaFont.label')} icon={Type} iconColor="bg-indigo-500" description={t('marketing.accessibility.items.dyslexiaFont.desc')} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Cognitive & Understanding */}
                        <Card className="rounded-[2rem] overflow-hidden shadow-sm border-black/5">
                            <CardHeader className="bg-[#f5f5f7] border-b">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Layers className="h-5 w-5 text-orange-500" />
                                    {t('marketing.accessibility.groupCognitiveTitle')}
                                </CardTitle>
                                <CardDescription className="text-xs font-medium">{t('marketing.accessibility.groupCognitiveDesc')}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="flex flex-col">
                                    <FeatureRow label={t('marketing.accessibility.items.errorPrevention.label')} icon={ShieldAlert} iconColor="bg-orange-500" description={t('marketing.accessibility.items.errorPrevention.desc')} />
                                    <FeatureRow label={t('marketing.accessibility.items.readingLevel.label')} icon={Languages} iconColor="bg-orange-500" description={t('marketing.accessibility.items.readingLevel.desc')} />
                                    <FeatureRow label={t('marketing.accessibility.items.stepByStep.label')} icon={ListOrdered} iconColor="bg-orange-500" description={t('marketing.accessibility.items.stepByStep.desc')} />
                                    <FeatureRow label={t('marketing.accessibility.items.termConsistency.label')} icon={CheckCircle} iconColor="bg-orange-500" description={t('marketing.accessibility.items.termConsistency.desc')} />
                                    <FeatureRow label={t('marketing.accessibility.items.focusMode.label')} icon={Layers} iconColor="bg-orange-500" description={t('marketing.accessibility.items.focusMode.desc')} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Interaction & Motor */}
                        <Card className="rounded-[2rem] overflow-hidden shadow-sm border-black/5">
                            <CardHeader className="bg-[#f5f5f7] border-b">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <MousePointerClick className="h-5 w-5 text-teal-500" />
                                    {t('marketing.accessibility.groupMotorTitle')}
                                </CardTitle>
                                <CardDescription className="text-xs font-medium">{t('marketing.accessibility.groupMotorDesc')}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="flex flex-col">
                                    <FeatureRow label={t('marketing.accessibility.items.limitShortcuts.label')} icon={Command} iconColor="bg-teal-500" description={t('marketing.accessibility.items.limitShortcuts.desc')} />
                                    <FeatureRow label={t('marketing.accessibility.items.fullKeyboard.label')} icon={Keyboard} iconColor="bg-teal-500" description={t('marketing.accessibility.items.fullKeyboard.desc')} />
                                    <FeatureRow label={t('marketing.accessibility.items.focusFrame.label')} icon={Maximize} iconColor="bg-teal-500" description={focusFrameDesc} />
                                    <FeatureRow label={t('marketing.accessibility.items.dragDropAlt.label')} icon={MousePointerClick} iconColor="bg-teal-500" description={t('marketing.accessibility.items.dragDropAlt.desc')} />
                                    <FeatureRow label={t('marketing.accessibility.items.largeTouchTargets.label')} icon={Maximize} iconColor="bg-teal-500" description={t('marketing.accessibility.items.largeTouchTargets.desc')} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Screen Reader & Media */}
                        <Card className="rounded-[2rem] overflow-hidden shadow-sm border-black/5">
                            <CardHeader className="bg-[#f5f5f7] border-b">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Volume2 className="h-5 w-5 text-blue-500" />
                                    {t('marketing.accessibility.groupMediaTitle')}
                                </CardTitle>
                                <CardDescription className="text-xs font-medium">{t('marketing.accessibility.groupMediaDesc')}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="flex flex-col">
                                    <FeatureRow label={t('marketing.accessibility.items.muteAutoAudio.label')} icon={VolumeX} iconColor="bg-blue-500" description={t('marketing.accessibility.items.muteAutoAudio.desc')} />
                                    <FeatureRow label={t('marketing.accessibility.items.ignoreDecorative.label')} icon={ImageOff} iconColor="bg-blue-500" description={t('marketing.accessibility.items.ignoreDecorative.desc')} />
                                    <FeatureRow label={t('marketing.accessibility.items.dynamicAnnouncements.label')} icon={Rss} iconColor="bg-blue-500" description={t('marketing.accessibility.items.dynamicAnnouncements.desc')} />
                                    <FeatureRow label={t('marketing.accessibility.items.mediaDescriptions.label')} icon={FileVideo} iconColor="bg-blue-500" description={t('marketing.accessibility.items.mediaDescriptions.desc')} />
                                    <FeatureRow label={t('marketing.accessibility.items.logicalOrder.label')} icon={ListOrdered} iconColor="bg-blue-500" description={t('marketing.accessibility.items.logicalOrder.desc')} />
                                    <FeatureRow label={t('marketing.accessibility.items.screenReader.label')} icon={Ear} iconColor="bg-blue-500" description={screenReaderDesc} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Time & Control Management */}
                        <Card className="rounded-[2rem] overflow-hidden shadow-sm border-black/5">
                            <CardHeader className="bg-[#f5f5f7] border-b">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-slate-600" />
                                    {t('marketing.accessibility.groupTimeTitle')}
                                </CardTitle>
                                <CardDescription className="text-xs font-medium">{t('marketing.accessibility.groupTimeDesc')}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="flex flex-col">
                                    <FeatureRow label={t('marketing.accessibility.items.undoTime.label')} icon={Undo2} iconColor="bg-slate-600" description={t('marketing.accessibility.items.undoTime.desc')} />
                                    <FeatureRow label={t('marketing.accessibility.items.timeoutWarnings.label')} icon={MessageSquareWarning} iconColor="bg-slate-600" description={t('marketing.accessibility.items.timeoutWarnings.desc')} />
                                    <FeatureRow label={t('marketing.accessibility.items.autoSave.label')} icon={History} iconColor="bg-slate-600" description={t('marketing.accessibility.items.autoSave.desc')} />
                                    <FeatureRow label={t('marketing.accessibility.items.disableTimeLimits.label')} icon={Clock} iconColor="bg-slate-600" description={t('marketing.accessibility.items.disableTimeLimits.desc')} />
                                    <FeatureRow label={t('marketing.accessibility.items.transactionConfirmation.label')} icon={ShieldCheck} iconColor="bg-slate-600" description={t('marketing.accessibility.items.transactionConfirmation.desc')} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Configure CTA banner — sends users to the real settings page */}
                        <div className="p-6 md:p-8 bg-primary/5 rounded-[2rem] border border-primary/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white rounded-2xl shadow-sm shrink-0">
                                    <Settings2 className="h-6 w-6 text-primary" />
                                </div>
                                <p className="text-sm font-bold text-[#1d1d1f] leading-snug">{t('marketing.accessibility.together')}</p>
                            </div>
                            <Button asChild size="lg" className="rounded-full px-8 h-12 font-bold shadow-lg shadow-primary/20 w-full sm:w-auto shrink-0">
                                <Link href="/settings/accessibility">
                                    {t('marketing.accessibility.configureCta')}
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </section>

                {/* --- Footer Context Section --- */}
                <section className="p-4">
                    <div className="space-y-8 pt-10 border-t max-w-3xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <div className="p-3 bg-indigo-50 rounded-2xl w-fit"><Scale className="h-6 w-6 text-indigo-600" /></div>
                                <h4 className="font-bold text-sm">{t('marketing.accessibility.legalComplianceTitle')}</h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">{t('marketing.accessibility.legalComplianceDesc')}</p>
                            </div>
                            <div className="space-y-2">
                                <div className="p-3 bg-orange-50 rounded-2xl w-fit"><Globe className="h-6 w-6 text-orange-600" /></div>
                                <h4 className="font-bold text-sm">{t('marketing.accessibility.universalDesignTitle')}</h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">{t('marketing.accessibility.universalDesignDesc')}</p>
                            </div>
                            <div className="space-y-2">
                                <div className="p-3 bg-teal-50 rounded-2xl w-fit"><Target className="h-6 w-6 text-teal-600" /></div>
                                <h4 className="font-bold text-sm">{t('marketing.accessibility.continuousImprovementTitle')}</h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">{t('marketing.accessibility.continuousImprovementDesc')}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="py-16 md:py-24 px-6 text-center bg-[#f5f5f7]">
                    <div className="container mx-auto max-w-3xl space-y-8 md:space-y-10">
                        <ShieldCheck className="h-12 w-12 md:h-16 md:w-16 text-primary mx-auto mb-4 md:mb-6" />
                        <h2 className="text-3xl md:text-4xl font-black tracking-tighter">{t('marketing.accessibility.finalCommitTitle')}</h2>
                        <p className="text-base md:text-lg text-muted-foreground leading-relaxed font-medium">
                            {t('marketing.accessibility.finalCommitDesc')}
                        </p>
                        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Button asChild size="lg" className="rounded-full px-10 md:px-12 h-12 md:h-14 font-bold shadow-xl shadow-primary/20 text-base md:text-lg w-full sm:w-auto">
                                <Link href="/settings/accessibility">
                                    <Settings2 className="mr-2 h-5 w-5" />
                                    {t('marketing.accessibility.configureCta')}
                                </Link>
                            </Button>
                            <Button asChild variant="ghost" size="lg" className="rounded-full px-10 md:px-12 h-12 md:h-14 font-bold border border-black/10 hover:bg-white text-base md:text-lg w-full sm:w-auto">
                                <Link href="/feedback">{t('marketing.accessibility.feedbackCta')}</Link>
                            </Button>
                        </div>
                    </div>
                </section>
            </main>

            <PublicFooter currentPageLabel={t('marketing.accessibility.footerLabel')} />
        </div>
    );
}
