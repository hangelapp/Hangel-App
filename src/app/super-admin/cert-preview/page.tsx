'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, Download, Droplet, Eye, HandHeart, Loader2, Ticket, X as XIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { isNativeApp } from '@/lib/capacitor';
import { generateEventCertificate } from '@/lib/event-certificate';
import { generateVolunteerCertificate } from '@/lib/volunteer-certificate';
import { buildCertCode, certVerifyUrl } from '@/lib/certificate-code';

// Örnek (dummy) sertifika kartları için ortak tip. Her kart kendi üreticisini
// çağırır ve aynı iOS-güvenli görüntüle/indir akışını kullanır.
type SampleCert = {
    id: string;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    fileName: string;
    build: () => Promise<Blob>;
};

// Gerçekçi DUMMY veriler — gönüllülük, etkinlik ve kan bağışı için.
// Kodlar buildCertCode ile, doğrulama linkleri certVerifyUrl ile üretilir;
// böylece QR'daki kod ile sertifika üzerindeki kod birebir eşleşir.
const SAMPLE_USER = 'Ayşe Yılmaz';
const SAMPLE_ORG = 'hangel';
const SAMPLE_DATE = '2026-06-15';

const volunteerCode = buildCertCode({ kind: 'volunteer', country: '90', idSeed: 'ornek-gonulluluk' });
const eventCode = buildCertCode({ kind: 'event', country: '90', idSeed: 'ornek-etkinlik' });
const bloodCode = buildCertCode({ kind: 'blood', country: '90', idSeed: 'ornek-kan' });

// Gönüllülük: kendi üreticisi (generateVolunteerCertificate).
// Etkinlik: generateEventCertificate, role=participant.
// Kan: uygulamadaki gerçek akışla aynı — type:'blood' sertifikalar
// certificates-tab içinde generateEventCertificate'e düşer (kind!=='volunteer'),
// role:'participant', başlık "Kan Bağışı Sertifikası" + kan türü kodu.
const SAMPLE_CERTS: readonly SampleCert[] = [
    {
        id: 'volunteer',
        label: 'Gönüllülük Sertifikası',
        description: 'Onaylı gönüllülük katkısı için verilen sertifika. Gönüllü: Ayşe Yılmaz.',
        icon: HandHeart,
        fileName: 'ornek-gonulluluk-sertifikasi.pdf',
        build: () =>
            generateVolunteerCertificate({
                taskTitle: 'Sahil Temizliği Gönüllülüğü',
                organizerName: SAMPLE_ORG,
                userName: SAMPLE_USER,
                date: SAMPLE_DATE,
                certificateId: 'ornek-gonulluluk',
                code: volunteerCode,
            }),
    },
    {
        id: 'event',
        label: 'Etkinlik Katılım Sertifikası',
        description: 'Bir etkinliğe katılan kişiye verilen sertifika. Rol: Katılımcı.',
        icon: Ticket,
        fileName: 'ornek-etkinlik-sertifikasi.pdf',
        build: () =>
            generateEventCertificate({
                eventName: 'İyilik Buluşması 2026',
                eventDate: SAMPLE_DATE,
                userName: SAMPLE_USER,
                organizerName: SAMPLE_ORG,
                role: 'participant',
                certificateId: 'ornek-etkinlik',
                code: eventCode,
            }),
    },
    {
        id: 'blood',
        label: 'Kan Bağışı Sertifikası',
        description: 'Kan bağışı yapan bağışçıya verilen sertifika. Bağışçı: Ayşe Yılmaz.',
        icon: Droplet,
        fileName: 'ornek-kan-bagisi-sertifikasi.pdf',
        build: () =>
            generateEventCertificate({
                eventName: 'Kan Bağışı Sertifikası',
                eventDate: SAMPLE_DATE,
                userName: SAMPLE_USER,
                organizerName: 'hangel Kan',
                role: 'participant',
                certificateId: 'ornek-kan',
                code: bloodCode,
                verifyUrl: certVerifyUrl(bloodCode),
            }),
    },
];

/**
 * Super-admin "Örnek Sertifikalar" önizleme sayfası.
 *
 * Üç sertifika türünün (gönüllülük / etkinlik / kan bağışı) gerçek üreticileriyle
 * üretilmiş ÖRNEK kopyalarını GÖRÜNTÜLER + İNDİRİR. İndirme/görüntüleme,
 * certificates-tab.tsx ile BİREBİR aynı iOS-güvenli akışı kullanır:
 * native → Filesystem.writeFile + Share/Browser; web → blob indir / iframe modal.
 */
export default function CertPreviewPage() {
    const { toast } = useToast();

    // Hangi kartın işlemde olduğunu (spinner için) tut.
    const [busy, setBusy] = useState<{ id: string; action: 'view' | 'download' } | null>(null);
    // Web önizleme modalı: oluşturulan blob URL'i + sertifika başlığı.
    const [previewState, setPreviewState] = useState<{ url: string; title: string; fileName: string; build: () => Promise<Blob> } | null>(null);

    // Blob → base64 (native Filesystem.writeFile için).
    const blobToBase64 = (blob: Blob): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(((reader.result as string) || '').split(',')[1] || '');
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
        });

    // Native: Documents'a yaz + paylaş; Web: blob indir.
    const downloadBlob = async (blob: Blob, fileName: string, title: string) => {
        if (isNativeApp()) {
            const { Filesystem, Directory } = await import('@capacitor/filesystem');
            const { Share } = await import('@capacitor/share');
            const base64 = await blobToBase64(blob);
            const written = await Filesystem.writeFile({
                path: fileName,
                data: base64,
                directory: Directory.Documents,
            });
            try {
                await Share.share({
                    title,
                    text: `${title} (örnek)`,
                    url: written.uri,
                    dialogTitle: 'Kaydet veya paylaş',
                });
            } catch {
                // kullanıcı paylaşımı kapattı — dosya zaten kaydedildi
            }
            toast({ title: 'Sertifika kaydedildi', description: `${fileName} Belgeler klasörüne kaydedildi.` });
            return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => { try { URL.revokeObjectURL(url); } catch { /* ignore */ } }, 1500);
        toast({ title: 'Sertifika indirildi', description: `${title} indirildi.` });
    };

    const handleDownload = async (cert: SampleCert) => {
        setBusy({ id: cert.id, action: 'download' });
        try {
            const blob = await cert.build();
            await downloadBlob(blob, cert.fileName, cert.label);
        } catch {
            toast({ variant: 'destructive', title: 'Sertifika oluşturulamadı', description: 'PDF üretilirken bir hata oluştu. Lütfen tekrar deneyin.' });
        } finally {
            setBusy(null);
        }
    };

    // Native: Cache'e yaz + Browser ile aç; Web: iframe modal önizleme.
    const handleView = async (cert: SampleCert) => {
        setBusy({ id: cert.id, action: 'view' });
        try {
            const blob = await cert.build();
            if (isNativeApp()) {
                const { Filesystem, Directory } = await import('@capacitor/filesystem');
                const { Browser } = await import('@capacitor/browser');
                const base64 = await blobToBase64(blob);
                const written = await Filesystem.writeFile({
                    path: cert.fileName,
                    data: base64,
                    directory: Directory.Cache,
                });
                await Browser.open({ url: written.uri });
                return;
            }
            const blobUrl = URL.createObjectURL(blob);
            if (previewState?.url) {
                try { URL.revokeObjectURL(previewState.url); } catch { /* ignore */ }
            }
            setPreviewState({ url: blobUrl, title: cert.label, fileName: cert.fileName, build: cert.build });
        } catch {
            toast({ variant: 'destructive', title: 'Sertifika açılamadı', description: 'PDF üretilirken bir hata oluştu. Lütfen tekrar deneyin.' });
        } finally {
            setBusy(null);
        }
    };

    const closePreview = () => {
        if (previewState?.url) {
            try { URL.revokeObjectURL(previewState.url); } catch { /* ignore */ }
        }
        setPreviewState(null);
    };

    return (
        <div className="space-y-6 max-w-3xl">
            <div className="space-y-1">
                <h1 className="text-2xl font-black tracking-tighter">Örnek Sertifikalar</h1>
                <p className="text-sm text-muted-foreground">
                    Üç sertifika türünün gerçek üreticileriyle hazırlanmış örnek kopyalarını görüntüleyin ve indirin.
                </p>
            </div>

            {SAMPLE_CERTS.map((cert) => {
                const Icon = cert.icon;
                const viewing = busy?.id === cert.id && busy.action === 'view';
                const downloading = busy?.id === cert.id && busy.action === 'download';
                return (
                    <Card key={cert.id} className="rounded-2xl border-primary/30 bg-primary/5">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Icon className="h-4 w-4 text-primary" /> {cert.label}
                            </CardTitle>
                            <CardDescription>{cert.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    onClick={() => handleView(cert)}
                                    disabled={busy !== null}
                                    variant="outline"
                                    className="rounded-xl"
                                >
                                    {viewing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
                                    Görüntüle
                                </Button>
                                <Button
                                    onClick={() => handleDownload(cert)}
                                    disabled={busy !== null}
                                    className="rounded-xl"
                                >
                                    {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                    İndir
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}

            {/* Web önizleme modalı — popup yerine in-app dialog (certificates-tab ile aynı). */}
            <Dialog open={!!previewState} onOpenChange={(open) => { if (!open) closePreview(); }}>
                <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col rounded-3xl overflow-hidden p-0">
                    <DialogHeader className="px-6 py-3 border-b flex flex-row items-center justify-between space-y-0 gap-3">
                        <DialogTitle className="text-base font-semibold truncate flex-1">
                            {previewState?.title ?? ''}
                        </DialogTitle>
                        <Button variant="ghost" size="icon" onClick={closePreview} aria-label="Kapat">
                            <XIcon className="h-5 w-5" />
                        </Button>
                    </DialogHeader>
                    {previewState?.url && (
                        <iframe
                            src={previewState.url}
                            title={previewState.title}
                            className="flex-1 w-full border-0 bg-muted"
                        />
                    )}
                    <DialogFooter className="px-6 py-3 border-t gap-2 sm:gap-2">
                        {previewState && (
                            <Button
                                onClick={async () => {
                                    try {
                                        const blob = await previewState.build();
                                        await downloadBlob(blob, previewState.fileName, previewState.title);
                                    } catch {
                                        toast({ variant: 'destructive', title: 'Sertifika oluşturulamadı', description: 'PDF üretilirken bir hata oluştu. Lütfen tekrar deneyin.' });
                                    }
                                }}
                                className="gap-2"
                            >
                                <Download className="h-4 w-4" /> PDF İndir
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Award className="h-3.5 w-3.5" />
                Bu sayfadaki tüm veriler örnektir; gerçek bir kişiye veya kayda ait değildir.
            </div>
        </div>
    );
}
