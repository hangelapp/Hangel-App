'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';
import { useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

const SETTINGS_DOC = 'siteSettings';
const CONTENT_ID = 'webContent';

export default function WebContentPage() {
    const { toast } = useToast();
    const db = useFirestore();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // About page fields
    const [aboutTitle, setAboutTitle] = useState('İyiliği Dijitalleştirdik.');
    const [aboutSubtitle, setAboutSubtitle] = useState('Geleceğin dayanışma modelini inşa ediyoruz.');
    const [aboutDesc, setAboutDesc] = useState('Bireyleri, sivil toplum kuruluşlarını ve markaları toplumsal fayda odağında birleştiren, en kapsamlı sosyal etki platformuyuz.');
    const [socialTitle, setSocialTitle] = useState('Bir Sosyal Girişim Hikayesi.');
    const [socialDesc, setSocialDesc] = useState('Hangel, kârını toplumsal faydaya yatıran bir sosyal girişimdir. Amacımız ticari başarıyı, sosyal sorunlara sürdürülebilir çözümler üretmek için bir araç olarak kullanmaktır.');
    const [foundationTitle, setFoundationTitle] = useState('Kuruluş Felsefemiz.');
    const [foundationDesc, setFoundationDesc] = useState('Yola çıkarken tek bir mottomuz vardı: "Yok öyle yalnız başına mücadele etmek".');

    // Logo/branding fields
    const [logoUrl, setLogoUrl] = useState('');
    const [logoText, setLogoText] = useState('hangel');
    const [primaryColor, setPrimaryColor] = useState('#0070f3');
    const [siteTitle, setSiteTitle] = useState('Hangel');
    const [siteDescription, setSiteDescription] = useState('Sosyal Etki Platformu');
    const [faviconUrl, setFaviconUrl] = useState('');

    useEffect(() => {
        if (!db) return;
        const load = async () => {
            try {
                const snap = await getDoc(doc(db, SETTINGS_DOC, CONTENT_ID));
                if (snap.exists()) {
                    const d = snap.data();
                    if (d.about) {
                        setAboutTitle(d.about.title || aboutTitle);
                        setAboutSubtitle(d.about.subtitle || aboutSubtitle);
                        setAboutDesc(d.about.description || aboutDesc);
                        setSocialTitle(d.about.socialTitle || socialTitle);
                        setSocialDesc(d.about.socialDesc || socialDesc);
                        setFoundationTitle(d.about.foundationTitle || foundationTitle);
                        setFoundationDesc(d.about.foundationDesc || foundationDesc);
                    }
                    if (d.branding) {
                        setLogoUrl(d.branding.logoUrl || '');
                        setLogoText(d.branding.logoText || logoText);
                        setPrimaryColor(d.branding.primaryColor || primaryColor);
                        setSiteTitle(d.branding.siteTitle || siteTitle);
                        setSiteDescription(d.branding.siteDescription || siteDescription);
                        setFaviconUrl(d.branding.faviconUrl || '');
                    }
                }
            } catch (e) {
                // No settings yet, use defaults
            } finally {
                setIsLoading(false);
            }
        };
        load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [db]);

    const handleSaveAbout = async () => {
        if (!db) return;
        setIsSaving(true);
        try {
            setDocumentNonBlocking(doc(db, SETTINGS_DOC, CONTENT_ID), {
                about: {
                    title: aboutTitle,
                    subtitle: aboutSubtitle,
                    description: aboutDesc,
                    socialTitle,
                    socialDesc,
                    foundationTitle,
                    foundationDesc,
                }
            }, { merge: true });
            toast({ title: 'Kaydedildi', description: 'Hakkımızda sayfası güncellendi.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveBranding = async () => {
        if (!db) return;
        setIsSaving(true);
        try {
            setDocumentNonBlocking(doc(db, SETTINGS_DOC, CONTENT_ID), {
                branding: {
                    logoUrl,
                    logoText,
                    primaryColor,
                    siteTitle,
                    siteDescription,
                    faviconUrl,
                }
            }, { merge: true });
            toast({ title: 'Kaydedildi', description: 'Marka ayarları güncellendi.' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin h-8 w-8 text-muted-foreground" /></div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">WEB İçerik Yönetimi</h1>
                <p className="text-muted-foreground text-sm">Web sayfalarının metin ve marka içeriklerini yönetin.</p>
            </div>

            <Tabs defaultValue="branding" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="branding">Logo & Marka</TabsTrigger>
                    <TabsTrigger value="about">Hakkımızda</TabsTrigger>
                </TabsList>

                {/* Logo & Marka */}
                <TabsContent value="branding" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Logo & Marka Ayarları</CardTitle>
                            <CardDescription>Site logosu, renkleri ve genel marka bilgilerini buradan yönetin.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4 p-4 border rounded-lg">
                                <h4 className="font-semibold">Logo</h4>
                                <div className="space-y-2">
                                    <Label>Logo URL (CDN veya harici bağlantı)</Label>
                                    <Input
                                        value={logoUrl}
                                        onChange={e => setLogoUrl(e.target.value)}
                                        placeholder="https://example.com/logo.svg"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Logo Metni (Logo yoksa gösterilir)</Label>
                                    <Input
                                        value={logoText}
                                        onChange={e => setLogoText(e.target.value)}
                                        placeholder="hangel"
                                    />
                                </div>
                                {logoUrl && (
                                    <div className="p-3 border rounded-lg bg-muted/30">
                                        <p className="text-xs text-muted-foreground mb-2">Önizleme:</p>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={logoUrl} alt="Logo önizleme" className="h-12 object-contain" />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4 p-4 border rounded-lg">
                                <h4 className="font-semibold">Site Bilgileri</h4>
                                <div className="space-y-2">
                                    <Label>Site Başlığı</Label>
                                    <Input value={siteTitle} onChange={e => setSiteTitle(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Site Açıklaması (SEO)</Label>
                                    <Input value={siteDescription} onChange={e => setSiteDescription(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Favicon URL</Label>
                                    <Input
                                        value={faviconUrl}
                                        onChange={e => setFaviconUrl(e.target.value)}
                                        placeholder="https://example.com/favicon.ico"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 p-4 border rounded-lg">
                                <h4 className="font-semibold">Renkler</h4>
                                <div className="flex items-center gap-4">
                                    <div className="space-y-2 flex-1">
                                        <Label>Ana Renk</Label>
                                        <Input value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} placeholder="#0070f3" />
                                    </div>
                                    <div className="mt-6">
                                        <input
                                            type="color"
                                            value={primaryColor}
                                            onChange={e => setPrimaryColor(e.target.value)}
                                            className="h-10 w-10 rounded cursor-pointer border"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleSaveBranding} disabled={isSaving} className="rounded-xl">
                                {isSaving && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                                Marka Ayarlarını Kaydet
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* Hakkımızda */}
                <TabsContent value="about" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Hakkımızda Sayfası</CardTitle>
                            <CardDescription>/about sayfasının içeriklerini düzenleyin.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4 p-4 border rounded-lg">
                                <h4 className="font-semibold">Ana Başlık</h4>
                                <div className="space-y-2">
                                    <Label>Başlık</Label>
                                    <Input value={aboutTitle} onChange={e => setAboutTitle(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Alt Başlık</Label>
                                    <Input value={aboutSubtitle} onChange={e => setAboutSubtitle(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Açıklama</Label>
                                    <Textarea value={aboutDesc} onChange={e => setAboutDesc(e.target.value)} rows={3} />
                                </div>
                            </div>
                            <div className="space-y-4 p-4 border rounded-lg">
                                <h4 className="font-semibold">Sosyal Girişim Bölümü</h4>
                                <div className="space-y-2">
                                    <Label>Başlık</Label>
                                    <Input value={socialTitle} onChange={e => setSocialTitle(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Açıklama</Label>
                                    <Textarea value={socialDesc} onChange={e => setSocialDesc(e.target.value)} rows={3} />
                                </div>
                            </div>
                            <div className="space-y-4 p-4 border rounded-lg">
                                <h4 className="font-semibold">Kuruluş Felsefesi</h4>
                                <div className="space-y-2">
                                    <Label>Başlık</Label>
                                    <Input value={foundationTitle} onChange={e => setFoundationTitle(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Açıklama</Label>
                                    <Textarea value={foundationDesc} onChange={e => setFoundationDesc(e.target.value)} rows={3} />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleSaveAbout} disabled={isSaving} className="rounded-xl">
                                {isSaving && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                                Hakkımızda Sayfasını Güncelle
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
