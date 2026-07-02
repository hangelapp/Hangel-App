'use client';

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Download, Share2, Loader2 } from 'lucide-react';

type Entity = { id?: string; name?: string; avatarUrl?: string };

export type UnifiedStoryData = {
    name: string;
    avatarUrl?: string;
    impactScore: number;
    totalDonation: number;
    volunteerHours: number;
    totalImpactValue: number;
    highestBadgeLevel?: string;
    certificateCount: number;
    countryRank?: string | number;
    supportedNgos: Entity[];
    volunteerNgos: Entity[];
    joinedClubs: Entity[];
};

const fmt = (n: number) => (Number.isFinite(n) ? n.toLocaleString('tr-TR') : '0');

/**
 * Tek-kart, Apple iPhone tarzı (SF-Pro tipografisi + glassmorphism + büyük rakamlar).
 * 9:16 oran (Instagram/IG story uyumlu) — Story olarak kaydedip paylaşılabilir.
 */
export function UnifiedStoryCard({ data }: { data: UnifiedStoryData }) {
    const cardRef = useRef<HTMLDivElement | null>(null);
    const { toast } = useToast();
    const [isDownloading, setIsDownloading] = useState(false);
    const [isSharing, setIsSharing] = useState(false);

    const allEntities = [
        ...data.supportedNgos,
        ...data.volunteerNgos,
        ...data.joinedClubs,
    ].filter((e, i, arr) => e?.name && arr.findIndex(x => x.name === e.name) === i);

    const renderAsImage = async (): Promise<Blob | null> => {
        if (!cardRef.current) return null;
        const { default: html2canvas } = await import('html2canvas');
        const canvas = await html2canvas(cardRef.current, {
            backgroundColor: null,
            scale: 2,
            useCORS: true,
            logging: false,
        });
        return new Promise((resolve) => canvas.toBlob(b => resolve(b), 'image/png'));
    };

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            const blob = await renderAsImage();
            if (!blob) throw new Error('canvas-empty');
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `hangel-etki-hikayem-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast({ title: 'İndirildi', description: 'Hikayen telefonuna kaydedildi.' });
        } catch {
            toast({ variant: 'destructive', title: 'İndirilemedi', description: 'Lütfen tekrar dene.' });
        } finally {
            setIsDownloading(false);
        }
    };

    const handleShare = async () => {
        setIsSharing(true);
        try {
            const blob = await renderAsImage();
            if (!blob) throw new Error('canvas-empty');
            const file = new File([blob], 'hangel-etki-hikayem.png', { type: 'image/png' });
            if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'hangel etki hikayem',
                    text: `${data.name} — hangel'deki etki hikayem`,
                });
            } else {
                // Fallback: download
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `hangel-etki-hikayem-${Date.now()}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                toast({ title: 'Hikaye indirildi', description: 'Paylaşmak için galerine gidebilirsin.' });
            }
        } catch {
            toast({ variant: 'destructive', title: 'Paylaşılamadı', description: 'Lütfen tekrar dene.' });
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Story card — 9:16, Apple-iPhone dili */}
            <div className="mx-auto w-full max-w-md overflow-hidden">
                <div
                    ref={cardRef}
                    className="relative w-full aspect-[9/16] rounded-[2.5rem] overflow-hidden text-white shadow-2xl"
                    style={{
                        background: 'radial-gradient(120% 100% at 50% 0%, #2a0d05 0%, #0a0a0a 60%, #000000 100%)',
                    }}
                >
                    {/* Üst hangel logosu + glow — kontrast için düşük opaklık, mobilde küçük */}
                    <div className="absolute top-0 right-0 w-48 h-48 sm:w-72 sm:h-72 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 opacity-[0.22]" style={{ backgroundColor: '#f34723' }} />
                    <div className="absolute bottom-0 left-0 w-44 h-44 sm:w-64 sm:h-64 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 opacity-[0.18]" style={{ backgroundColor: '#f34723' }} />

                    <div className="relative h-full flex flex-col p-7">
                        {/* Header — hangel wordmark */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase tracking-[0.3em] opacity-95">hangel</span>
                            <span className="text-xs font-medium opacity-85">etki hikayem</span>
                        </div>

                        {/* Kullanıcı identity */}
                        <div className="flex flex-col items-center text-center mt-5 space-y-2.5">
                            <Avatar className="h-20 w-20 ring-4 ring-white/15 shadow-xl">
                                <AvatarImage src={data.avatarUrl} alt={data.name} />
                                <AvatarFallback className="text-2xl font-black bg-white/10 text-white">
                                    {data.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <p className="text-sm font-bold tracking-tight text-white break-words max-w-full">{data.name}</p>
                            {data.countryRank && (
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/90">
                                    🇹🇷 Türkiye Sıralaması · {data.countryRank}
                                </p>
                            )}
                        </div>

                        {/* Hero metric — Etki Puanı */}
                        <div className="flex flex-col items-center mt-5">
                            <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/90">Etki Puanı</p>
                            <p
                                className="text-7xl font-black tracking-tighter tabular-nums leading-none mt-1"
                                style={{ color: '#f34723', textShadow: '0 4px 30px rgba(243,71,35,0.4)' }}
                            >
                                {fmt(data.impactScore)}
                            </p>
                        </div>

                        {/* Stats grid — 2x2 glassmorphism */}
                        <div className="grid grid-cols-2 gap-2 mt-5">
                            <StatTile label="Bağış" value={`${fmt(data.totalDonation)} ₺`} />
                            <StatTile label="Gönüllülük" value={`${fmt(data.volunteerHours)} sa`} />
                            <StatTile label="Sosyal Etki ₺" value={`${fmt(data.totalImpactValue)} ₺`} />
                            <StatTile label="Sertifika" value={fmt(data.certificateCount)} />
                        </div>

                        {/* En yüksek rozet */}
                        {data.highestBadgeLevel && (
                            <div className="mt-3 flex items-center justify-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 mx-auto border border-white/15">
                                <span className="text-xs font-bold uppercase tracking-widest text-white/90">En Yüksek Rozet</span>
                                <span className="text-xs font-black text-white">{data.highestBadgeLevel}</span>
                            </div>
                        )}

                        {/* Topluluk — logos row */}
                        {allEntities.length > 0 && (
                            <div className="mt-4">
                                <p className="text-xs font-black uppercase tracking-[0.2em] text-white/80 text-center mb-2">
                                    Birlikte İyileştirdiğim Topluluk
                                </p>
                                <div className="flex items-center justify-center -space-x-1.5">
                                    {allEntities.slice(0, 6).map((e, i) => (
                                        <Avatar key={i} className="h-9 w-9 ring-2 ring-black border border-white/15 bg-white/10">
                                            <AvatarImage src={e.avatarUrl} alt={e.name || ''} />
                                            <AvatarFallback className="text-xs font-bold bg-white/15 text-white">
                                                {(e.name || '?').charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    ))}
                                    {allEntities.length > 6 && (
                                        <div className="h-9 w-9 rounded-full ring-2 ring-black bg-white/15 backdrop-blur-md flex items-center justify-center text-xs font-bold text-white">
                                            +{allEntities.length - 6}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Footer wordmark */}
                        <div className="mt-auto pt-4 text-center">
                            <p className="text-xs font-medium tracking-[0.25em] text-white/75">hangel.org</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Aksiyon butonları */}
            <div className="flex gap-2 max-w-md mx-auto">
                <Button onClick={handleDownload} disabled={isDownloading} className="flex-1 h-12 rounded-2xl font-bold">
                    {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Download className="mr-2 h-4 w-4" /> İndir</>}
                </Button>
                <Button onClick={handleShare} disabled={isSharing} variant="outline" className="flex-1 h-12 rounded-2xl font-bold">
                    {isSharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Share2 className="mr-2 h-4 w-4" /> Paylaş</>}
                </Button>
            </div>
        </div>
    );
}

function StatTile({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-white/10 backdrop-blur-md rounded-2xl px-3 py-2.5 border border-white/15">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/90 truncate">{label}</p>
            <p className="text-base font-black tabular-nums leading-tight mt-0.5 truncate text-white">{value}</p>
        </div>
    );
}
