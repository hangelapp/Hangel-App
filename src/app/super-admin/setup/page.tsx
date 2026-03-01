
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { DatabaseZap, Loader2, AlertTriangle } from 'lucide-react';

// Import JSON files
import usersJson from '../../../../docs/database-exports/users.json';
import ngosJson from '../../../../docs/database-exports/ngos.json';
import brandsJson from '../../../../docs/database-exports/brands.json';
import eventsJson from '../../../../docs/database-exports/events.json';
import volunteeringJson from '../../../../docs/database-exports/volunteering.json';
import badgesJson from '../../../../docs/database-exports/badges.json';
import certificatesJson from '../../../../docs/database-exports/certificates.json';
import libraryJson from '../../../../docs/database-exports/library.json';
import postsJson from '../../../../docs/database-exports/timeline_posts.json';

export default function SetupPage() {
    const db = useFirestore();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState<string[]>([]);

    const logProgress = (msg: string) => setProgress(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);

    const handleImport = async () => {
        if (!db) {
            toast({ variant: 'destructive', title: "Hata", description: "Veritabanı bağlantısı hazır değil." });
            return;
        }
        
        setIsLoading(true);
        setProgress([]);
        logProgress("Kurulum başlatıldı...");

        try {
            logProgress("Kullanıcılar aktarılıyor...");
            usersJson.forEach((u: any) => setDocumentNonBlocking(doc(db, 'users', u.id), u, { merge: true }));

            logProgress("STK'lar aktarılıyor...");
            ngosJson.forEach((n: any) => setDocumentNonBlocking(doc(db, 'ngos', n.id), n, { merge: true }));

            logProgress("Markalar aktarılıyor...");
            brandsJson.forEach((b: any) => setDocumentNonBlocking(doc(db, 'brands', b.id), b, { merge: true }));

            logProgress("Etkinlikler aktarılıyor...");
            eventsJson.forEach((e: any) => setDocumentNonBlocking(doc(db, 'events', e.id), e, { merge: true }));

            logProgress("Gönüllülük ilanları aktarılıyor...");
            volunteeringJson.forEach((v: any) => setDocumentNonBlocking(doc(db, 'volunteering', v.id), v, { merge: true }));

            logProgress("Kütüphane içerikleri aktarılıyor...");
            libraryJson.forEach((l: any) => setDocumentNonBlocking(doc(db, 'library', l.slug), l, { merge: true }));

            logProgress("Zaman tüneli gönderileri aktarılıyor...");
            postsJson.forEach((p: any) => setDocumentNonBlocking(doc(db, 'posts', p.id), p, { merge: true }));

            logProgress("Rozet ve sertifikalar (Kullanıcı 1) ekleniyor...");
            badgesJson.forEach((badge: any) => setDocumentNonBlocking(doc(db, 'users', '1', 'badges', badge.id), badge, { merge: true }));
            certificatesJson.forEach((cert: any) => setDocumentNonBlocking(doc(db, 'users', '1', 'certificates', cert.id), cert, { merge: true }));

            logProgress("Tüm veriler başarıyla kuyruğa alındı!");
            toast({ title: "Kurulum Tamamlandı" });
        } catch (error: any) {
            logProgress(`Hata: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto p-4">
            <h1 className="text-3xl font-black tracking-tighter">Veritabanı Kurulum Merkezi</h1>
            <Card className="border-red-200 bg-red-50">
                <CardHeader>
                    <CardTitle className="text-red-800 flex items-center gap-2"><AlertTriangle /> Veri Senkronizasyonu</CardTitle>
                    <CardDescription className="text-red-700">Tüm modülleri (Kütüphane, Gönderiler dahil) Firestore'a aktarın.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleImport} disabled={isLoading} className="w-full bg-red-600 hover:bg-red-700 h-14 rounded-2xl">
                        {isLoading ? <Loader2 className="animate-spin mr-2" /> : <DatabaseZap className="mr-2" />} Tüm Modülleri Firestore'a Aktar
                    </Button>
                </CardContent>
            </Card>
            <Card><CardContent><div className="bg-black text-green-400 p-4 rounded-xl font-mono text-xs h-64 overflow-y-auto">{progress.map((p, i) => <p key={i}>{p}</p>)}</div></CardContent></Card>
        </div>
    );
}
