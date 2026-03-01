'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { DatabaseZap, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Import JSON files (assumed available in current bundle via relative path or provided by user)
import usersJson from '../../../../docs/database-exports/users.json';
import ngosJson from '../../../../docs/database-exports/ngos.json';
import brandsJson from '../../../../docs/database-exports/brands.json';
import eventsJson from '../../../../docs/database-exports/events.json';
import volunteeringJson from '../../../../docs/database-exports/volunteering.json';
import badgesJson from '../../../../docs/database-exports/badges.json';
import certificatesJson from '../../../../docs/database-exports/certificates.json';

export default function SetupPage() {
    const db = useFirestore();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState<string[]>([]);

    const logProgress = (msg: string) => setProgress(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);

    const handleImport = async () => {
        setIsLoading(true);
        setProgress([]);
        logProgress("Kurulum başlatıldı...");

        try {
            // 1. Users Import
            logProgress("Kullanıcılar aktarılıyor...");
            usersJson.forEach((u: any) => {
                const ref = doc(db, 'users', u.id);
                setDocumentNonBlocking(ref, u, { merge: true });
            });

            // 2. NGOs Import
            logProgress("STK'lar aktarılıyor...");
            ngosJson.forEach((n: any) => {
                const ref = doc(db, 'ngos', n.id);
                setDocumentNonBlocking(ref, n, { merge: true });
            });

            // 3. Brands Import
            logProgress("Markalar aktarılıyor...");
            brandsJson.forEach((b: any) => {
                const ref = doc(db, 'brands', b.id);
                setDocumentNonBlocking(ref, b, { merge: true });
            });

            // 4. Events Import
            logProgress("Etkinlikler aktarılıyor...");
            eventsJson.forEach((e: any) => {
                const ref = doc(db, 'events', e.id);
                setDocumentNonBlocking(ref, e, { merge: true });
            });

            // 5. Volunteering Import
            logProgress("Gönüllülük ilanları aktarılıyor...");
            volunteeringJson.forEach((v: any) => {
                const ref = doc(db, 'volunteering', v.id);
                setDocumentNonBlocking(ref, v, { merge: true });
            });

            // 6. Badges & Certificates (Subcollections for user '1')
            logProgress("Kullanıcı '1' için rozet ve sertifikalar ekleniyor...");
            badgesJson.forEach((badge: any) => {
                const ref = doc(db, 'users', '1', 'badges', badge.id);
                setDocumentNonBlocking(ref, badge, { merge: true });
            });
            certificatesJson.forEach((cert: any) => {
                const ref = doc(db, 'users', '1', 'certificates', cert.id);
                setDocumentNonBlocking(ref, cert, { merge: true });
            });

            logProgress("Tüm veriler başarıyla kuyruğa alındı!");
            toast({ title: "Kurulum Tamamlandı", description: "Tüm mock datalar Firestore'a aktarıldı." });
        } catch (error: any) {
            logProgress(`Hata: ${error.message}`);
            toast({ variant: 'destructive', title: "Hata", description: "Veri aktarımı sırasında bir sorun oluştu." });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <h1 className="text-3xl font-black tracking-tighter">Veritabanı Kurulumu</h1>
            <Card className="border-red-200 bg-red-50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-800">
                        <AlertTriangle className="h-5 w-5" />
                        Dikkat: Veri Üzerine Yazma
                    </CardTitle>
                    <CardDescription className="text-red-700">
                        Bu işlem, mevcut Firestore koleksiyonlarınızdaki aynı ID'ye sahip dökümanların üzerine mock dataları yazacaktır. Bu işlem geri alınamaz.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button 
                        onClick={handleImport} 
                        disabled={isLoading}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-14 rounded-2xl shadow-xl"
                    >
                        {isLoading ? (
                            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Veriler Yazılıyor...</>
                        ) : (
                            <><DatabaseZap className="mr-2 h-5 w-5" /> Mock Dataları Firestore'a Aktar</>
                        )}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-bold uppercase tracking-widest">Kurulum Logları</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="bg-black text-green-400 p-4 rounded-xl font-mono text-xs h-64 overflow-y-auto space-y-1">
                        {progress.length === 0 ? (
                            <p className="opacity-50 italic">Henüz işlem başlatılmadı...</p>
                        ) : (
                            progress.map((p, i) => <p key={i}>{p}</p>)
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
